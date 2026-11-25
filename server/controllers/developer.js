const user = require('../models/user');
const company = require('../models/company');
const permissionschema = require('../models/permission');
const permission = require('../utils/permission');

const allUser = async (req, res, next) => {
    try {
        const query = await user.find({ role: 'superadmin' })
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            users: query
        });

    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const addUser = async (req, res, next) => {
    const { name, email, password } = req.body;
    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password?.trim()) {
        return res.status(400).json({ message: "Name, email, and password are required" });
    }

    try {
        const existing = await user.findOne({ email: cleanEmail }).lean();
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const newuser = new user({
            name: cleanName,
            registeredName: cleanName,
            email: cleanEmail,
            password: password.trim(),
            permissions: permission.superAdmin,
            role: "superadmin"
        });
        const savedUser = await newuser.save();

        const newcompany = new company({ adminId: savedUser._id });
        const savedcompany = await newcompany.save();

        await user.findByIdAndUpdate(savedUser._id, { companyId: savedcompany._id });

        return res.status(201).json({
            message: "User created"
        });

    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const getDemo = async (req, res, next) => {
    const { id } = req.params;
    try {
        const demousers = await user.find({ companyId: id, role: 'demo' }).select('email name').lean();

        return res.status(200).json({
            demousers
        });

    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};
const deleteDemo = async (req, res, next) => {
    const { id } = req.params;
    try {
        const deleted = await user.findOneAndDelete({ _id: id, role: 'demo' });
        if (!deleted) {
            return res.status(404).json({ message: 'Demo user not found' });
        }

        return res.status(200).json({
            message: 'Demo User Deleted'
        });

    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const addDemo = async (req, res, next) => {
    const { companyId, name, email, password } = req.body;
    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!companyId || !cleanName || !cleanEmail || !password?.trim()) {
        return res.status(400).json({ message: "Company, name, email, and password are required" });
    }

    try {
        const existing = await user.findOne({ email: cleanEmail }).lean();
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const newuser = new user({
            name: cleanName,
            companyId,
            email: cleanEmail,
            password: password.trim(),
            permissions: permission.demo,
            role: "demo"
        });
        await newuser.save();

        return res.status(201).json({
            message: "Demo user created"
        });

    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const editUser = async (req, res, next) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
        return res.status(400).json({ message: "Name and email are required" });
    }

    try {
        const userDoc = await user.findById(id);
        if (!userDoc) {
            return res.status(404).json({ message: "User not found" });
        }

        const duplicate = await user.findOne({ email: cleanEmail, _id: { $ne: id } }).lean();
        if (duplicate) {
            return res.status(409).json({ message: "Another account with this email already exists" });
        }

        userDoc.registeredName = cleanName;
        userDoc.name = cleanName;
        userDoc.email = cleanEmail;
        if (password && password.trim()) {
            userDoc.password = password.trim();
        }
        await userDoc.save();

        return res.status(200).json({
            message: "Edited Successfully"
        });

    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const adddefaultpermission = async (req, res, next) => {
    try {
        await permissionschema.insertMany(permission);
        return res.status(201).json({ message: 'Default permissions added' });
    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};
const saveModule = async (req, res, next) => {
    try {
        await user.updateMany({ role: 'developer' }, { AllPermissionNames: req.body.modules });

        return res.status(200).json({
            message: 'Module Updated'
        });
    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};
const getdefaultpermission = async (req, res, next) => {
    try {
        const permission = await permissionschema.find().lean();
        const permissionnames = await user.findById(req.user.id).select('AllPermissionNames').lean();

        return res.status(200).json({
            permission, permissionnames
        });
    } catch (error) {
        console.log(error.message);
        return next({ status: 500, message: error.message });
    }
};

const updatedefaultpermission = async (req, res, next) => {
    const { id } = req.params;

    try {
        const defaulte = await permissionschema.findByIdAndUpdate(id, {
            $set: {
                modules: req.body.modules
            }
        });
        return res.status(200).json({
            message: 'Permission Updated'
        })
    } catch (error) {
        console.log(error.message)
        return next({ status: 500, message: error.message });
    }
}


const { getErrorLogs, clearErrorLogs } = require('../utils/errorLogger');

const getSystemErrors = async (req, res, next) => {
    try {
        const errors = getErrorLogs();
        return res.status(200).json({
            count: errors.length,
            errors
        });
    } catch (error) {
        return next({ status: 500, message: error.message });
    }
};

const clearSystemErrors = async (req, res, next) => {
    try {
        clearErrorLogs();
        return res.status(200).json({ message: "Error logs cleared successfully" });
    } catch (error) {
        return next({ status: 500, message: error.message });
    }
};

module.exports = { 
    allUser, 
    addUser, 
    editUser, 
    addDemo, 
    getDemo, 
    deleteDemo, 
    saveModule, 
    adddefaultpermission, 
    updatedefaultpermission, 
    getdefaultpermission,
    getSystemErrors,
    clearSystemErrors
};