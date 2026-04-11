const Voucher = require('../models/voucher');
const Ledger = require('../models/ledger');
const Entry = require('../models/entry');
const mongoose = require('mongoose');

class AccountingService {
  /**
   * Create a voucher and corresponding ledger entries
   * @param {Object} voucherData 
   * @param {mongoose.ClientSession} session 
   */
  async createVoucher(voucherData, session) {
    const { companyId, type, employeeId, entries, referenceType, referenceId, remarks, branchId } = voucherData;

    // Generate Voucher Number
    const voucherNo = `VCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const voucher = new Voucher({
      companyId,
      branchId,
      voucherNo,
      type,
      employeeId,
      entries,
      referenceType,
      referenceId,
      remarks
    });

    await voucher.save({ session });

    // If it's an employee-related voucher, update the ledger
    if (employeeId) {
      for (const entry of entries) {
        const accountName = entry.accountName.toLowerCase();
        if (accountName.includes('payable') || accountName.includes('employee')) {
           await this.recordLedgerEntry({
             employeeId,
             companyId,
             branchId,
             type: entry.type, 
             amount: entry.amount,
             source: referenceType.toLowerCase(),
             voucherId: voucher._id,
             referenceId,
             remarks: remarks || `Voucher ${voucherNo}`
           }, session);
        }
      }
    }

    return voucher;
  }

  /**
   * Sync an existing salary voucher and its ledger entry during payroll edit
   * @param {mongoose.Types.ObjectId} voucherId 
   * @param {Number} grossSalary 
   * @param {mongoose.ClientSession} session 
   */
  async syncSalaryVoucher(voucherId, grossSalary, session) {
    if (!voucherId) return;

    const voucher = await Voucher.findById(voucherId).session(session);
    if (!voucher) return;

    // 1. Update Voucher Document
    voucher.entries.forEach(entry => {
      // Update both Debit (Expense) and Credit (Payable) to the new grossSalary
      entry.amount = grossSalary;
    });
    await voucher.save({ session });

    // 2. Update the corresponding Ledger Entry (Credit)
    // We find the entry by voucherId and source: 'payroll' (or whatever referenceType was used)
    const entry = await Entry.findOne({ 
      voucherId: voucher._id,
      ledgerId: { $exists: true } // Ensure it's a ledger entry, not just any entry
    }).session(session);

    if (entry) {
      entry.credit = grossSalary;
      entry.particular = voucher.remarks + " (Edited)";
      await entry.save({ session });
    }
  }

  async recordLedgerEntry(data, session = null) {
    const { 
      employeeId, 
      companyId, 
      date = new Date(), 
      type, // 'DEBIT' or 'CREDIT'
      amount, 
      source, 
      referenceId, 
      remarks,
      voucherId 
    } = data;

    const amountNum = Number(amount) || 0;
    const Employee = mongoose.model('employee');

    // 1. Get or Create the Ledger account for this employee (Account Summary)
    const emp = await Employee.findById(employeeId).populate('userid').session(session);
    if (!emp) throw new Error("Employee not found for ledger recording");

    let empLedger;
    if (emp.ledgerId) {
      empLedger = await Ledger.findById(emp.ledgerId).session(session);
    }

    if (!empLedger) {
      // Fallback search by employeeId
      empLedger = await Ledger.findOne({ employeeId }).session(session);
    }
    
    if (!empLedger) {
      empLedger = new Ledger({
        employeeId,
        companyId: companyId || emp.companyId,
        name: emp?.userid?.name || emp?.employeeName || 'Unknown',
        profileImage: emp?.profileimage,
        advance: 0
      });
      await empLedger.save({ session });
      
      // Link back to employee
      emp.ledgerId = empLedger._id;
      await emp.save({ session });
    }

    // 2. Get the last entry to calculate the running balance
    const lastEntry = await Entry.findOne({ ledgerId: empLedger._id })
      .sort({ date: -1, _id: -1 })
      .session(session);
    
    let lastBalance = Number(lastEntry?.balance || 0);
    
    // 3. Calculate new balance
    // In this system: 
    // CREDIT increases the balance (Liability/Advance provided)
    // DEBIT decreases the balance (Payments/Adjustments/Recoveries)
    let balanceAfter = lastBalance;
    if (type === 'CREDIT') {
      balanceAfter += amountNum;
    } else {
      balanceAfter -= amountNum;
    }

    // 4. Create the Entry
    const newEntry = new Entry({
      ledgerId: empLedger._id,
      date,
      particular: remarks || `${type} for ${source}`,
      debit: type === 'DEBIT' ? amountNum : 0,
      credit: type === 'CREDIT' ? amountNum : 0,
      balance: balanceAfter,
      source: source || 'ledger',
      referenceId: referenceId || voucherId,
      voucherId
    });

    await newEntry.save({ session });
    
    // 5. Update summary fields
    empLedger.advance = balanceAfter;
    await empLedger.save({ session });

    // 6. Update Employee summary for easy access
    emp.advance = balanceAfter;
    await emp.save({ session });

    return newEntry;
  }

  async getEmployeeLedger(employeeId) {
    const empLedger = await Ledger.findOne({ employeeId });
    if (!empLedger) return { entries: [] };
    
    const entries = await Entry.find({ ledgerId: empLedger._id })
      .sort({ date: -1, _id: -1 })
      .populate('voucherId');
      
    return { ...empLedger.toObject(), entries };
  }
}

module.exports = new AccountingService();
