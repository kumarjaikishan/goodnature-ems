const employeeModal = require('../models/employee');
const usermodal = require('../models/user');
const Ledger = require('../models/ledger');
const mongoose = require('mongoose');

class EmployeeService {
    async generateNextEmpId(prefix = "EMP", padding = 3) {
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
        return `${prefix}${nextNumber.toString().padStart(padding, '0')}`;
    }

    async createEmployee(data, file = null, session) {
        const { email, password = 'employee', employeeName } = data;

        // 1. Create User
        const createUser = new usermodal({ 
            name: employeeName, 
            email, 
            role: 'employee', 
            password 
        });
        const savedUser = await createUser.save({ session });

        // 2. Generate Emp ID
        const empId = await this.generateNextEmpId();

        // 3. Prepare Employee Data
        const employeeObjectId = new mongoose.Types.ObjectId();
        const ledgerObjectId = new mongoose.Types.ObjectId();

        const jsonFields = ["allowances", "bonuses", "deductions", "achievements", "education", "guardian"];
        let employeeData = {
            _id: employeeObjectId,
            userid: savedUser._id,
            empId,
            profileimage: file?.secure_url,
            ledgerId: ledgerObjectId,
            employeeName
        };

        for (const key in data) {
            let value = data[key];
            if (jsonFields.includes(key) && typeof value === "string") {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    value = (key === "guardian") ? { name: "", relation: "S/o" } : [];
                }
            }
            if (key === "salary") value = Number(value) || 0;
            if (["status", "overridedefaultPolicies", "allowSeeLedger"].includes(key)) {
                value = (value === true || value === "true");
            }

            if (!["_id", "companyId", "userid", "empId", "ledgerId", "photo", "password"].includes(key)) {
                employeeData[key] = value;
            }
        }

        const employee = new employeeModal(employeeData);
        const savedEmployee = await employee.save({ session });

        // 4. Create Ledger
        const ledger = new Ledger({
            _id: ledgerObjectId,
            name: employeeName,
            employeeId: employeeObjectId,
            profileImage: file?.secure_url
        });
        await ledger.save({ session });

        // 5. Update User with Employee Reference
        await usermodal.findByIdAndUpdate(savedUser._id, { employeeId: savedEmployee._id }).session(session);

        return savedEmployee;
    }

    async updateEmployee(employeeId, data, file = null, session) {
        const existingEmployee = await employeeModal.findById(employeeId).session(session);
        if (!existingEmployee) throw new Error("Employee not found");

        const jsonFields = ["allowances", "bonuses", "deductions", "achievements", "education", "guardian"];
        let employeeUpdateData = {};
        let userUpdateData = {};

        if (file) {
            employeeUpdateData.profileimage = file.secure_url;
            await Ledger.findByIdAndUpdate(existingEmployee.ledgerId, { profileImage: file.secure_url }).session(session);
        }

        for (const key in data) {
            let value = data[key];
            if (jsonFields.includes(key) && typeof value === "string") {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    value = (key === "guardian") ? { name: "", relation: "S/o" } : [];
                }
            }
            if (key === "salary") value = Number(value) || 0;
            if (["status", "overridedefaultPolicies", "allowSeeLedger"].includes(key)) {
                value = (value === true || value === "true");
            }

            if (key === "employeeName") {
                userUpdateData.name = value;
                employeeUpdateData.employeeName = value;
                await Ledger.findByIdAndUpdate(existingEmployee.ledgerId, { name: value }).session(session);
            } else if (key === "email") {
                userUpdateData.email = value;
            } else if (!["_id", "companyId", "userid", "empId", "ledgerId", "photo", "password", "employeeId"].includes(key)) {
                employeeUpdateData[key] = value;
            }
        }

        const updatedEmployee = await employeeModal.findByIdAndUpdate(employeeId, employeeUpdateData, { new: true, session });
        if (Object.keys(userUpdateData).length > 0) {
            await usermodal.findByIdAndUpdate(existingEmployee.userid, userUpdateData).session(session);
        }

        return updatedEmployee;
    }
}

module.exports = new EmployeeService();
