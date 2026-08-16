const departmentModal = require('../models/department');
const employeeModal = require('../models/employee');
const usermodal = require('../models/user');
const leavemodal = require('../models/leave')
const holidaymodal = require('../models/holiday')
const LeaveBalance = require('../models/leavebalance')
const advancemodal = require('../models/advance')
const Ledger = require("../models/ledger");
const Entry = require("../models/entry");
const notificationmodal = require('../models/notification')
const attendanceModal = require('../models/attandence');
const noticeModal = require('../models/notice');
const LeavePolicy = require('../models/leavePolicy');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { default: mongoose } = require('mongoose');
const company = require('../models/company');
const branch = require('../models/branch');
const removePhotoBySecureUrl = require('../utils/cloudinaryremove')
const employeeService = require('../services/employeeService');
const Essl = require('../models/essllivelogs');
const EsslEvent = require('../models/esslEvent');
const dayjs = require('dayjs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// generateNextEmpId moved to employeeService

async function generateNextEmpId(prefix = "EMP", padding = 3) {
    try {
        const lastEmployee = await employeeModal.findOne()
            .sort({ empId: -1 })
            .lean();

        let nextNumber = 1;
        if (lastEmployee && lastEmployee.empId) {
            const match = lastEmployee.empId.match(/\d+$/);
            if (match) {
                nextNumber = parseInt(match[0], 10) + 1;
            }
        }

        const nextEmpId = prefix + String(nextNumber).padStart(padding, "0");
        return nextEmpId;
    } catch (err) {
        console.error("Error generating next empId:", err);
        throw new Error("Failed to generate employee ID");
    }
}

const addDepartment = async (req, res, next) => {
    try {
        const { branchId, department, description } = req.body;

        if (!department) {
            return next({ status: 400, message: "Department name is required" });
        }

        const normalizedDept = department.toLowerCase();

        const isExist = await departmentModal.findOne({
            branchId,
            department: normalizedDept,
        });

        if (isExist) {
            return next({
                status: 400,
                message: "Department already exists for this branch",
            });
        }

        const newDepartment = new departmentModal({
            branchId,
            department: normalizedDept,
            description,
        });

        const result = await newDepartment.save();
        if (!result) {
            return next({ status: 400, message: "Something went wrong" });
        }

        res.status(201).json({
            message: "Department created successfully",
            department: result,
        });
    } catch (error) {
        console.error(error.message);
        return next({ status: 500, message: error.message });
    }
};

const updatedepartment = async (req, res, next) => {
    try {
        const { department, description, departmentId } = req.body;
        if (!department || !departmentId) {
            return next({ status: 400, message: "all fields are required" });
        }

        const dept = await departmentModal.findById(departmentId);
        if (!dept) {
            return next({ status: 404, message: "Department not found" });
        }

        dept.department = department;
        if (description !== undefined) dept.description = description;
        await dept.save();

        res.status(200).json({
            message: 'Department Updated Successfully'
        });
    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const deletedepartment = async (req, res, next) => {
    try {
        const { departmentId } = req.body;
        if (!departmentId) {
            return next({ status: 400, message: "departmentId is required" });
        }

        const query = await departmentModal.findByIdAndDelete(departmentId);

        if (!query) {
            return next({ status: 404, message: "Department not found" });
        }

        res.status(200).json({
            message: 'Department Deleted Successfully'
        });
    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const departmentlist = async (req, res, next) => {
    try {
        let filter = {};
        if (req.user.role === 'manager' && Array.isArray(req.user.branchIds)) {
            filter.branchId = { $in: req.user.branchIds };
        }

        const query = await departmentModal.find(filter).populate('branchId', 'name');

        res.status(200).json({
            list: query
        });

    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const addemployee = async (req, res, next) => {
    const { email } = req.body;
    if (!req.body.employeeName || !email || !req.body.department || !req.body.branchId) {
        return res.status(400).json({ message: "Please Fill required Fields" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingUser = await usermodal.findOne({ email }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ message: 'Email already in use.' });
        }

        let uploadResult = null;
        if (req.file) {
            uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: 'ems/employee' });
            fs.unlink(req.file.path, (err) => { if (err) console.error('Failed to delete local file:', err); });
        }

        await employeeService.createEmployee(req.body, uploadResult, session);

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ message: 'employee Created Successfully' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Employee Creation Error:", error.message);
        return res.status(500).json({ message: 'Server error during employee creation' });
    }
};

const updateemployee = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { employeeId, department, branchId } = req.body;
        if (!employeeId || !department || !branchId) {
            return next({ status: 400, message: "Required fields (employeeId, department, branchId) are missing." });
        }

        let uploadResult = null;
        if (req.file) {
            uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: "ems/employee" });
            fs.unlink(req.file.path, err => { if (err) console.log("File delete error:", err.message); });
        }

        await employeeService.updateEmployee(employeeId, req.body, uploadResult, session);

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ message: "Employee updated successfully." });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Update employee error:", error.message);
        return next({ status: 500, message: error.message });
    }
};

const enrollFace = async (req, res, next) => {
    try {
        const { employeeId, descriptor } = req.body;
        if (!employeeId || !descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
            return next({ status: 400, message: "Invalid employeeId or descriptor" });
        }

        const emp = await employeeModal.findById(employeeId);
        if (!emp) {
            return next({ status: 404, message: "Employee not found" });
        }

        if (req.user.role === 'manager' && Array.isArray(req.user.branchIds)) {
            if (!req.user.branchIds.includes(emp.branchId?.toString())) {
                return res.status(403).json({ message: "Access denied: not your branch" });
            }
        }

        emp.faceDescriptor = descriptor;
        await emp.save();

        res.status(200).json({
            message: 'Face enrolled Successfully'
        });
    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const deletefaceenroll = async (req, res, next) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId) {
            return next({ status: 400, message: "Invalid employeeId" });
        }

        const emp = await employeeModal.findById(employeeId);
        if (!emp) {
            return next({ status: 404, message: "Employee not found" });
        }

        if (req.user.role === 'manager' && Array.isArray(req.user.branchIds)) {
            if (!req.user.branchIds.includes(emp.branchId?.toString())) {
                return res.status(403).json({ message: "Access denied: not your branch" });
            }
        }

        emp.faceDescriptor = null;
        await emp.save();

        res.status(200).json({
            message: 'Enrolled face deleted Successfully'
        });
    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const deleteemployee = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { employeeId } = req.body;
        if (!employeeId) {
            await session.abortTransaction(); session.endSession();
            return next({ status: 400, message: "employeeId is required" });
        }

        const employee = await employeeModal.findById(employeeId).session(session);
        if (!employee) {
            await session.abortTransaction(); session.endSession();
            return next({ status: 404, message: "Employee not found" });
        }

        if (req.user.role === 'manager' && Array.isArray(req.user.branchIds)) {
            if (!req.user.branchIds.includes(employee.branchId?.toString())) {
                await session.abortTransaction(); session.endSession();
                return res.status(403).json({ message: "Access denied: not your branch" });
            }
        }

        await employeeModal.deleteOne({ _id: employeeId }).session(session);
        await usermodal.deleteMany({ employeeId }).session(session);
        await leavemodal.deleteMany({ employeeId }).session(session);
        await attendanceModal.deleteMany({ employeeId }).session(session);

        await session.commitTransaction();
        session.endSession();

        if (employee.profileimage) {
            await removePhotoBySecureUrl([employee.profileimage]);
        }

        res.status(200).json({
            message: 'employee Deleted Successfully'
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const employeelist = async (req, res, next) => {
    try {
        let queryFilter = {};
        if (req.user.role === 'manager' && Array.isArray(req.user.branchIds)) {
            queryFilter.branchId = { $in: req.user.branchIds };
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 0; // 0 means return all for backward compatibility if unpaginated

        let query = employeeModal.find(queryFilter)
            .select('employeeName empId email department branchId profileimage status phone joiningDate salary ledgerId userid')
            .populate('department', 'department')
            .populate('userid', 'email');

        let total = 0;
        let pages = 1;

        if (limit > 0) {
            total = await employeeModal.countDocuments(queryFilter);
            pages = Math.ceil(total / limit);
            query = query.skip((page - 1) * limit).limit(limit);
        }

        const list = await query;
        let deptFilter = {};
        if (req.user.role === 'manager' && Array.isArray(req.user.branchIds)) {
            deptFilter.branchId = { $in: req.user.branchIds };
        }
        const departmentlist = await departmentModal.find(deptFilter).select('department');

        res.status(200).json({
            list,
            departmentlist,
            ...(limit > 0 ? { pagination: { page, limit, total, pages } } : {})
        });

    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const addAdmin = async (req, res, next) => {

    // console.log(req.body);
    // return res.status(400).json({ message: "All fields are required" });
    const { name, email, role, password, permissions } = req.body;

    if (!name || !email || !role || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingUser = await usermodal.findOne({ email }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ message: 'Email already in use.' });
        }

        const fields = {
            name,
            email,
            role,
            password,
            companyId: req.user.companyId,
        };

        // Convert permissions if stringified
        if (permissions && typeof permissions === 'string') {
            fields.permissions = JSON.parse(permissions);
        } else if (permissions && typeof permissions === 'object') {
            fields.permissions = permissions;
        }

        let uploadResult = null;
        if (req.file) {
            uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'ems/employee',
            });

            if (uploadResult?.secure_url) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Failed to delete local file:', err);
                });
                fields.profileImage = uploadResult.secure_url;
            }
        }

        const createUser = new usermodal({ ...fields }); // <-- FIXED
        await createUser.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: `${role} Created Successfully`,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error.message);
        return res.status(500).json({
            message: 'Server error',
        });
    }
};

const getAdmin = async (req, res, next) => {
    try {
        const admins = await usermodal.find({
            companyId: req.user.companyId,
            role: { $in: ["admin", "manager"] },
            _id: { $ne: req.userid }
        });

        res.status(200).json(admins);

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            message: 'Server error',
        });
    }
};

const updateprofile = async (req, res, next) => {
    try {
        const whichuser = await usermodal.findById(req.user.id);
        const oldprofile = whichuser?.profileImage || undefined;

        let uploadResult;
        if (req.file) {
            // upload new image
            uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "ems/employee",
            });

            if (uploadResult) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("Failed to delete local file:", err);
                });
            }
        }

        // Build update object dynamically
        const updateData = { name: req.body.name };
        if (uploadResult?.secure_url) {
            updateData.profileImage = uploadResult.secure_url;

            // remove old image only if new one is uploaded
            if (oldprofile) {
                await removePhotoBySecureUrl([oldprofile]);
            }
        }

        await usermodal.findByIdAndUpdate(req.user.id, updateData, { new: true });

        return res.status(200).json({
            message: "Updated successfully",
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            message: "Server error",
        });
    }
};



const editAdmin = async (req, res, next) => {
    const { name, email, role, permissions } = req.body;
    const { id } = req.params;
    // console.log(req.body);
    // return res.status(400).json({ message: "All fields are required" });

    if (!name || !email || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingUser = await usermodal.findOne({ email }).session(session);
        const oldprofile = existingUser.profileImage || undefined;

        if (existingUser.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(403).json({ message: "Access denied: This user don't Belong to You" });
        }

        if (existingUser && existingUser._id.toString() !== id) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ message: 'Email already in use.' });
        }

        const fields = {
            name,
            email,
            role,
            companyId: req.user.companyId
        };

        // Convert permissions if stringified
        if (permissions && typeof permissions === 'string') {
            fields.permissions = JSON.parse(permissions);
        } else if (permissions && typeof permissions === 'object') {
            fields.permissions = permissions;
        }

        // Handle profile image upload
        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'ems/employee'
            });

            if (uploadResult) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Failed to delete local file:', err);
                });
                fields.profileImage = uploadResult.secure_url;
            }

            if (oldprofile) {
                await removePhotoBySecureUrl([oldprofile]);
            }
        }

        const updatedUser = await usermodal.findByIdAndUpdate(
            id,
            { $set: fields },
            { new: true, session }
        );
        await redisClient.del(`permissions:${id}`);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: 'Admin updated successfully',
            user: updatedUser
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error.message);
        return res.status(500).json({ message: 'Server error' });
    }
};

const deleteAdmin = async (req, res, next) => {
    const { id } = req.params;

    try {
        const adminmanager = await usermodal.findOne({
            _id: id,
            role: { $in: ['admin', 'manager'] }
        });

        if (!adminmanager) {
            return res.status(400).json({ message: 'Wrong Id' });
        }

        if (!adminmanager.companyId.equals(req.user.companyId)) {
            return res.status(403).json({ message: "Access denied: This user doesn't belong to you" });
        }

        await usermodal.deleteOne({ _id: id });

        if (adminmanager.profileImage) {
            await removePhotoBySecureUrl([adminmanager.profileImage]);
        }

        if (adminmanager.role === 'manager') {
            for (const element of adminmanager.branchIds) {
                let previousmanager = await branch.findById(element);
                if (previousmanager) {
                    previousmanager.managerIds = previousmanager.managerIds.filter(
                        e => e.toString() !== adminmanager._id.toString()
                    );
                    await previousmanager.save();
                }
            }
        }

        res.status(200).json({
            message: 'Admin deleted successfully',
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: error.message });
    }
};


const firstfetch = async (req, res, next) => {
    try {
        const startOfMonth = dayjs().startOf('month').toDate();

        // 1️⃣ Parallel initial queries (User, Company, Ledger, Notices)
        const [user, companye, ledgerDocs, notices] = await Promise.all([
            usermodal.findById(req.user.id).select('name email profileImage role permissions branchIds').lean(),
            company.findOne().lean(),
            Ledger.find({ userId: req.user.id }).lean(),
            noticeModal.find().sort({ date: -1 }).lean()
        ]);

        let branches = [];
        let departmentlist = [];
        let employees = [];
        let adminManager = [];
        let attendance = [];
        let holidays = [];
        let leaveBalance = [];
        let leavePolicies = [];
        let advance = [];

        if (req.user.role == 'manager') {
            const allowedBranches = req.user.branchIds || [];

            const [branchesRes, departmentlistRes, employeesRes, holidaysRes, leavePoliciesRes] = await Promise.all([
                branch.find()
                    .populate({ path: 'managerIds', select: 'name profileimage' })
                    .lean(),
                departmentModal.find({ branchId: { $in: allowedBranches } })
                    .populate('branchId', 'name')
                    .select('department branchId')
                    .sort({ department: 1 })
                    .lean(),
                employeeModal.find({ branchId: { $in: allowedBranches } })
                    .populate('department', 'department')
                    .populate('userid', 'email name')
                    .sort({ empId: 1 })
                    .lean(),
                holidaymodal.find().lean(),
                LeavePolicy.find().lean()
            ]);

            branches = branchesRes;
            departmentlist = departmentlistRes;
            employees = employeesRes;
            holidays = holidaysRes;
            leavePolicies = leavePoliciesRes;

            const employeeIds = employees.map(emp => emp._id);

            const [attendanceRes, leaveBalanceRes, advanceRes] = await Promise.all([
                attendanceModal.find({
                    employeeId: { $in: employeeIds },
                    date: { $gte: startOfMonth }
                })
                    .select('-rulesSnapshot -dutyStart -dutyEnd')
                    .sort({ date: -1, empId: 1 })
                    .populate({
                        path: 'employeeId',
                        select: 'userid profileimage department',
                        populate: { path: 'userid', select: 'name' }
                    })
                    .populate({ path: 'leave', select: 'reason' })
                    .lean(),
                LeaveBalance.find({
                    branchId: { $in: allowedBranches }
                })
                    .populate({
                        path: "employeeId",
                        select: "userid profileimage empId designation",
                        populate: { path: "userid", select: "name" },
                    })
                    .sort({ date: -1, createdAt: -1 })
                    .lean(),
                advancemodal.find({
                    branchId: { $in: allowedBranches }
                })
                    .populate({
                        path: "employeeId",
                        select: "userid profileimage empId",
                        populate: { path: "userid", select: "name" },
                    })
                    .sort({ date: -1, createdAt: -1 })
                    .lean()
            ]);

            attendance = attendanceRes;
            leaveBalance = leaveBalanceRes;
            advance = advanceRes;
        }

        if (req.user.role == 'superadmin' || req.user.role == 'admin' || req.user.role == 'demo') {
            const [
                branchesRes,
                departmentlistRes,
                adminManagerRes,
                employeesRes,
                attendanceRes,
                holidaysRes,
                leaveBalanceRes,
                advanceRes,
                leavePoliciesRes
            ] = await Promise.all([
                branch.find()
                    .populate({ path: 'managerIds', select: 'name profileImage' })
                    .lean(),
                departmentModal.find()
                    .populate('branchId', 'name')
                    .select('department branchId')
                    .sort({ department: 1 })
                    .lean(),
                usermodal.find({ role: { $in: ['admin', 'manager'] } })
                    .select('-password')
                    .lean(),
                employeeModal.find()
                    .populate('department', 'department')
                    .populate('userid', 'email name role')
                    .sort({ empId: 1 })
                    .lean(),
                attendanceModal.find({ date: { $gte: startOfMonth } })
                    .select('-rulesSnapshot -dutyStart -dutyEnd')
                    .sort({ date: -1, empId: 1 })
                    .populate({
                        path: 'employeeId',
                        select: 'userid profileimage department',
                        populate: { path: 'userid', select: 'name' }
                    })
                    .populate({ path: 'leave', select: 'reason' })
                    .lean(),
                holidaymodal.find().lean(),
                LeaveBalance.find()
                    .populate({
                        path: "employeeId",
                        select: "userid profileimage empId designation",
                        populate: { path: "userid", select: "name" },
                    })
                    .sort({ date: -1, createdAt: -1 })
                    .lean(),
                advancemodal.find()
                    .populate({
                        path: "employeeId",
                        select: "userid profileimage empId designation",
                        populate: { path: "userid", select: "name" },
                    })
                    .sort({ date: -1, createdAt: -1 })
                    .lean(),
                LeavePolicy.find().lean()
            ]);

            branches = branchesRes;
            departmentlist = departmentlistRes;
            adminManager = adminManagerRes;
            employees = employeesRes;
            attendance = attendanceRes;
            holidays = holidaysRes;
            leaveBalance = leaveBalanceRes;
            advance = advanceRes;
            leavePolicies = leavePoliciesRes;
        }

        // Ledger balance processing
        const ledgerIds = ledgerDocs.map((l) => l._id);
        const latestBalanceByLedger = {};
        if (ledgerIds.length) {
            const latestEntries = await Entry.aggregate([
                { $match: { ledgerId: { $in: ledgerIds } } },
                { $sort: { ledgerId: 1, date: -1, createdAt: -1 } },
                { $group: { _id: '$ledgerId', balance: { $first: '$balance' } } }
            ]);
            latestEntries.forEach((entry) => {
                latestBalanceByLedger[entry._id.toString()] = entry.balance;
            });
        }

        const ledgersWithBalance = ledgerDocs.map((ledgerDoc) => ({
            ...ledgerDoc,
            netBalance: latestBalanceByLedger[ledgerDoc._id.toString()] ?? 0
        }));

        const response = {
            user: user,
            departmentlist,
            employee: employees,
            attendance,
            advance,
            holidays,
            notices,
            ledger: ledgersWithBalance,
            leaveBalance,
            leavePolicies
        };
        if (companye) response.company = companye;
        if (branches?.length) response.branch = branches;
        if (adminManager?.length) response.adminManager = adminManager;

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error in firstfetch:", error);
        return next({ status: 500, message: error.message });
    }
};

const addcompany = async (req, res, next) => {
    const { name, industry } = req.body;

    try {
        // Check if a company already exists for this admin
        const existingCompany = await company.findOne({ adminId: req.userid });

        if (existingCompany) {
            return res.status(400).json({ message: "Company already created" });
        }

        // Create a new company
        const newCompany = new company({ name, industry, adminId: req.userid });
        await newCompany.save();

        await usermodal.findByIdAndUpdate(req.userid, { companyId: newCompany._id })

        return res.status(200).json({ message: "Created new company", company: newCompany });

    } catch (error) {
        console.error(error.message);
        return next({ status: 500, message: error.message });
    }
};

const updateCompany = async (req, res, next) => {
    const { _id, ...updateFields } = req.body;

    try {
        // Fetch the existing company document
        const companyDoc = await company.findById(_id);

        if (!companyDoc) {
            return res.status(404).json({ message: "Company not found" });
        }

        // Keep track of the old logo before any changes
        const oldLogo = companyDoc.logo;

        // Update fields
        Object.assign(companyDoc, updateFields);

        // If a new file is uploaded
        if (req.file) {
            const cloudinaryResult = await cloudinary.uploader.upload(
                req.file.path,
                { folder: 'ems/company' }
            );

            // Delete local file
            fs.unlink(req.file.path, (err) => {
                if (err) console.log("Error deleting local file:", err.message);
            });

            // Set new logo URL
            companyDoc.logo = cloudinaryResult.secure_url;

            // Delete old logo from cloudinary if it exists
            if (oldLogo && oldLogo !== "") {
                await removePhotoBySecureUrl([oldLogo]);
            }
        }

        await companyDoc.save();

        return res.status(200).json({
            message: "Company updated successfully",
            logoUrl: companyDoc.logo
        });

    } catch (error) {
        console.error(error.message);
        return next({ status: 500, message: error.message });
    }
};


const addBranch = async (req, res, next) => {
    const { defaultsetting, name, location, companyId, managerIds = [] } = req.body;

    try {
        // Create new branch
        let fields = {
            name, location, companyId,
            managerIds, defaultsetting
        }
        if (!defaultsetting) {
            const setting = req.body.setting
            fields.setting = setting
        }
        const newBranch = new branch(fields);

        // Update user roles to 'manager' if managerIds provided
        if (managerIds.length > 0) {

            // Or, if you want faster parallel execution:
            await Promise.all(managerIds.map(empId =>
                usermodal.findOneAndUpdate({ employeeId: empId }, { role: 'manager' })
            ));
        }

        await newBranch.save();

        return res.status(200).json({ message: "Branch created", branch: newBranch });

    } catch (error) {
        console.error(error.message);
        return next({ status: 500, message: error.message });
    }
};


const editBranch = async (req, res, next) => {
    const { _id, name, location, companyId, defaultsetting, managerIds = [] } = req.body;

    try {
        const existingBranch = await branch.findById(_id);
        if (!existingBranch) {
            return next({ status: 404, message: "Branch not found" });
        }
        let updateDoc = {
            name, location, companyId, managerIds, defaultsetting
        }
        if (!defaultsetting) {
            const setting = req.body.setting
            updateDoc.setting = setting
        } else {
            updateDoc.$unset = { setting: 1 };
        }

        const previousManagerIds = existingBranch.managerIds.map(id => id.toString());
        const newManagerIds = managerIds.map(id => id.toString());

        const removedManagerIds = previousManagerIds.filter(id => !newManagerIds.includes(id));
        // console.log("removed id", removedManagerIds);

        const addedManagerIds = newManagerIds.filter(id => !previousManagerIds.includes(id));
        // console.log("new to be added id", addedManagerIds);

        await branch.findByIdAndUpdate(_id, updateDoc);

        // Remove this branch from removed managers
        for (const removedId of removedManagerIds) {
            await usermodal.findByIdAndUpdate(
                removedId,
                { $pull: { branchIds: _id } } // remove this branch from their array
            );
        }

        // Add this branch to added managers
        for (const addedId of addedManagerIds) {
            await usermodal.findByIdAndUpdate(
                addedId,
                { $addToSet: { branchIds: _id } } // add branch if not already in array
            );
        }

        return res.status(200).json({ message: "Branch Edited Successfully" });

    } catch (error) {
        console.error(error.message);
        return next({ status: 500, message: error.message });
    }
};

const deleteBranch = async (req, res, next) => {
    const { _id, name, location, companyId, managerIds = [] } = req.body;

    try {
        const existingBranch = await branch.findById(_id);
        if (!existingBranch) {
            return next({ status: 404, message: "Branch not found" });
        }

        const previousManagerIds = existingBranch.managerIds.map(id => id.toString());
        const newManagerIds = managerIds.map(id => id.toString());

        const removedManagerIds = previousManagerIds.filter(id => !newManagerIds.includes(id));
        // console.log("removed id", removedManagerIds);

        const addedManagerIds = newManagerIds.filter(id => !previousManagerIds.includes(id));
        // console.log("new to be added id", addedManagerIds);

        await branch.findByIdAndUpdate(_id, { name, location, companyId, managerIds });

        // Remove this branch from removed managers
        for (const removedId of removedManagerIds) {
            await usermodal.findByIdAndUpdate(
                removedId,
                { $pull: { branchIds: _id } } // remove this branch from their array
            );
        }

        // Add this branch to added managers
        for (const addedId of addedManagerIds) {
            await usermodal.findByIdAndUpdate(
                addedId,
                { $addToSet: { branchIds: _id } } // add branch if not already in array
            );
        }

        return res.status(200).json({ message: "Branch Edited Successfully" });

    } catch (error) {
        console.error(error.message);
        return next({ status: 500, message: error.message });
    }
};




const getemployee = async (req, res, next) => {
    const { empid } = req.query;
    try {
        const employe = await employeeModal.findById(empid)
            .populate('userid', '-password')
            .populate('department');

        return res.status(200).json(employe);
        // setTimeout(() => {
        //     return res.status(200).json(employe);
        // }, 100);

    } catch (error) {
        console.error(error.message);
        return next({ status: 500, message: 'Internal Server Error' });
    }
};
const updatepassword = async (req, res, next) => {
    const { userid, pass } = req.body.pass;

    if (!userid || !pass) {
        if (!user) {
            return res.status(400).json({ message: 'User ID and password are required' });
        }
    }

    try {
        const user = await usermodal.findById(userid);
        if (!user) {
            return res.status(400).json({ message: 'User not Found' });
        }
        if (user?.companyId?.toString() !== req.user?.companyId) {
            return res.status(403).json({ message: 'You are not Authorised' });
        }

        user.password = pass;
        await user.save()

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error.message);
        return next({ status: 500, message: error.message });
    }
};

const leavehandle = async (req, res, next) => {
    let { leaveid, status } = req.body;

    if (!leaveid || !status) return next({ status: 400, message: "Leave id and status is required" });

    try {
        const query = await leavemodal.findByIdAndUpdate(leaveid, { status }).populate('employeeId', 'userid');


        if (!query) return next({ status: 404, message: "Leave not found" });

        const userId = query.employeeId.userid;

        let message = '';
        const options = { day: '2-digit', month: 'short', year: 'numeric' };

        const fromFormatted = new Date(query.fromDate).toLocaleDateString('en-GB', options); // "21 Jun, 2025"
        const toFormatted = new Date(query.toDate).toLocaleDateString('en-GB', options);
        const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        message = `Your leave request from ${fromFormatted} to ${toFormatted} has been ${formattedStatus}.`;

        if (message && userId) {
            await notificationmodal.create({ userId, message });
        }

        if (status == 'approved') {
            const fromDate = new Date(query.fromDate);
            const toDate = new Date(query.toDate);
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(0, 0, 0, 0);

            const employeeId = query.employeeId._id;
            const branchId = query.branchId;

            // Iterate from fromDate to toDate
            for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
                // Clone date to avoid reference issue
                const currentDate = new Date(date);
                currentDate.setHours(0, 0, 0, 0);

                // Check if attendance already exists
                const existing = await attendanceModal.findOne({ employeeId, date: currentDate });
                if (existing) {
                    if (existing.status === 'absent') {
                        // Update status from 'absent' to 'leave'
                        existing.status = 'leave';
                        existing.source = 'leaveApproval';
                        await existing.save();
                    }
                    // If status is already 'leave' or 'present', skip
                } else {
                    // Insert new leave attendance
                    const attendanceData = {
                        companyId: req.user.companyId,
                        employeeId,
                        branchId,
                        date: currentDate,
                        status: 'leave',
                        leave: leaveid,
                        source: 'leaveApproval'
                    };
                    await attendanceModal.create(attendanceData);
                }
            }
        }

        return res.status(200).json({
            message: 'Updated Successfully'
        })
    } catch (error) {
        console.log(error.message)
        return next({ status: 500, message: error.message });
    }
}
const deleteleave = async (req, res, next) => {
    const { leaveid } = req.params;
    try {
        const query = await leavemodal.findByIdAndDelete(leaveid);

        if (!query) return next({ status: 404, message: "Leave not found" });

        return res.status(200).json({
            message: 'Deleted Successfully'
        })
    } catch (error) {
        console.log(error.message)
        return next({ status: 500, message: error.message });
    }
}

// ==========================================
// DEVELOPER ESSL MONITORING & BULK DELETION
// ==========================================
const getEsslLogsDeveloper = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const filter = {};
        if (search) {
            filter.$or = [
                { pin: { $regex: search, $options: 'i' } },
                { raw: { $regex: search, $options: 'i' } },
                { timestamp: { $regex: search, $options: 'i' } }
            ];
        }

        const [total, logs] = await Promise.all([
            Essl.countDocuments(filter),
            Essl.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        return res.status(200).json({
            success: true,
            total,
            page,
            limit,
            logs
        });
    } catch (error) {
        console.error("Error fetching ESSL logs for developer:", error);
        return next({ status: 500, message: error.message });
    }
};

const getEsslEventsDeveloper = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const type = req.query.type || '';

        const filter = {};
        if (type && type !== 'all') {
            filter.type = type;
        }
        if (search) {
            filter.$or = [
                { empId: { $regex: search, $options: 'i' } },
                { employeeName: { $regex: search, $options: 'i' } },
                { event: { $regex: search, $options: 'i' } }
            ];
        }

        const [total, events] = await Promise.all([
            EsslEvent.countDocuments(filter),
            EsslEvent.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        return res.status(200).json({
            success: true,
            total,
            page,
            limit,
            events
        });
    } catch (error) {
        console.error("Error fetching ESSL events for developer:", error);
        return next({ status: 500, message: error.message });
    }
};

const bulkDeleteEsslLogs = async (req, res, next) => {
    try {
        const { ids, deleteAll } = req.body;

        if (deleteAll) {
            const result = await Essl.deleteMany({});
            return res.status(200).json({
                success: true,
                message: `All ${result.deletedCount} ESSL logs deleted successfully.`,
                deletedCount: result.deletedCount
            });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of log IDs to delete." });
        }

        const result = await Essl.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} ESSL log(s) deleted successfully.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error bulk deleting ESSL logs:", error);
        return next({ status: 500, message: error.message });
    }
};

const bulkDeleteEsslEvents = async (req, res, next) => {
    try {
        const { ids, deleteAll } = req.body;

        if (deleteAll) {
            const result = await EsslEvent.deleteMany({});
            return res.status(200).json({
                success: true,
                message: `All ${result.deletedCount} ESSL events deleted successfully.`,
                deletedCount: result.deletedCount
            });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide an array of event IDs to delete." });
        }

        const result = await EsslEvent.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} ESSL event(s) deleted successfully.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error bulk deleting ESSL events:", error);
        return next({ status: 500, message: error.message });
    }
};

module.exports = {
    addDepartment, addBranch, enrollFace, addAdmin, deleteBranch, updateprofile, deleteleave, getAdmin, editAdmin, deleteAdmin, deletefaceenroll, updatepassword, updateCompany, editBranch, firstfetch, getemployee, addcompany, departmentlist, leavehandle, updatedepartment, deletedepartment, employeelist, addemployee,
    updateemployee, deleteemployee,
    getEsslLogsDeveloper, getEsslEventsDeveloper, bulkDeleteEsslLogs, bulkDeleteEsslEvents
};