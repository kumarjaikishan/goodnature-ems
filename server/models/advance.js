const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employee", required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    ledgerEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Entry" }, // Deprecated but keeping for compatibility

    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["given", "adjusted", "repaid"], required: true },
    amount: { type: Number, required: true }, // Transaction amount
    
    // New fields for individual advance tracking
    initialAmount: { type: Number }, // Original amount if it's a "given" type
    remainingBalance: { type: Number, default: 0 }, // Specific balance for this advance
    
    // Summary balance for the employee (legacy compatibility)
    balance: { type: Number, default: 0 }, 
    
    remarks: { type: String },
    reason: { type: String },

    payrollId: { type: mongoose.Schema.Types.ObjectId, ref: "Payroll" },
    status: { type: String, enum: ["pending", "partially_paid", "closed", "open"], default: "open" }
}, { timestamps: true });


// ✅ Auto update status before saving
advanceSchema.pre("save", function (next) {
    this.status = this.remainingBalance > 0 ? "open" : "closed";
    next();
});

// ✅ Validation for remainingBalance
advanceSchema.path("remainingBalance").validate(function (value) {
    return value >= 0;
}, "Remaining balance cannot be negative.");


module.exports = mongoose.model("Advance", advanceSchema);
