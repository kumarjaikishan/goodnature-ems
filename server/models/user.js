const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    registeredName: {
        type: String,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    branchIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }],
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },
    email: {
        type: String,
        default: '',
        sparse: true,
        index: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['developer', 'superadmin', 'admin', 'manager', 'employee', 'grant', 'demo', 'customer', 'sponsor', 'agent'],
        required: true,
    },
    profileImage: {
        type: String,
    },
    permissions: {
        type: Map,
        of: [Number],
        default: {}
    },
    temptoken: {
        type: String,
    },
    AllPermissionNames: {
        type: Array,
    },
    subscription: {
        plan: {
            type: String,
            enum: ["FREE", "STARTUP", "PRO", "ENTERPRISE"],
            default: "FREE"
        },

        isActive: {
            type: Boolean,
            default: false
        },

        expiresAt: Date
    },
    // Plot Customer & Sponsor fields
    sponsorCode: { type: String, unique: true, sparse: true, index: true },
    customerCode: { type: String, unique: true, sparse: true, index: true },
    isBlocked: { type: Boolean, default: false },
    mobile: { type: String, default: '' },
    sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    address: { type: String, default: '' },
    currentAddress: { type: String, default: '' },
    permanentAddress: { type: String, default: '' },
    sameAsCurrentAddress: { type: Boolean, default: false },
    dob: { type: String, default: '' },
    occupation: { type: String, default: '' },
    panCard: { type: String, default: '' },
    aadhaarCard: { type: String, default: '' },
    gender: { type: String, default: 'Male' },
    age: { type: Number },
    relationType: { type: String, default: 'Son of' },
    fatherOrHusbandName: { type: String, default: '' },
    nomineeName: { type: String, default: '' },
    nomineeRelation: { type: String, default: '' },
    nomineeAge: { type: Number },
    commissionRate: { type: Number, default: 0 },
    // Bank Details
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' }
}, { timestamps: true })


// secure the password
userSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password")) {
        return next();
    }
    try {
        const saltRound = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(user.password, saltRound);
        user.password = hash_password;
    } catch (error) {
        console.log(error);
        next(error);
    }
})

userSchema.methods.generateToken = async function () {
    try {
        return jwt.sign({
            userId: this._id.toString(),
            email: this.email,
            isAdmin: this.isadmin
        },
            process.env.jwt_token,
            {
                expiresIn: "30d",
            }
        );
    } catch (error) {
        console.error(error);
    }
};


userSchema.methods.checkpassword = async function (pass) {
    try {
        return await bcrypt.compare(pass, this.password);
    } catch (error) {
        console.error(error);
    }
};

const user = mongoose.models.User || mongoose.models.user || mongoose.model("user", userSchema);
if (!mongoose.models.User) {
    mongoose.model("User", userSchema);
}
module.exports = user;