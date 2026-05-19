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
  async syncSalaryVoucher(voucherId, newEntries, remarks, session) {
    if (!voucherId) return;

    // Support both (voucherId, newEntries, remarks, session) and (voucherId, newEntries, session)
    let actualSession = session;
    let actualRemarks = remarks;
    if (remarks && typeof remarks === 'object' && remarks.constructor.name === 'ClientSession') {
      actualSession = remarks;
      actualRemarks = undefined;
    }

    const voucher = await Voucher.findById(voucherId).session(actualSession);
    if (!voucher) return;

    // 1. Update Voucher Document entries and remarks
    voucher.entries = newEntries;
    if (actualRemarks) {
      voucher.remarks = actualRemarks;
    }
    await voucher.save({ session: actualSession });

    // 2. Update the corresponding Ledger Entry (Credit)
    const entry = await Entry.findOne({ 
      referenceId: voucher.referenceId,
      source: 'payroll',
      ledgerId: { $exists: true }
    }).session(actualSession);

    if (entry) {
      // Find the employee payable entry in the new list to get the new netSalary
      const payableEntry = newEntries.find(e => 
        e.accountName.toLowerCase().includes('payable') || 
        e.accountName.toLowerCase().includes('employee')
      );
      const newAmount = payableEntry ? payableEntry.amount : 0;
      
      // Update entry and propagate balance updates
      await this.updateLedgerEntry(entry._id, {
        credit: entry.debit > 0 ? 0 : newAmount,
        debit: entry.debit > 0 ? newAmount : 0,
        particular: voucher.remarks + " (Edited)",
        date: entry.date
      }, actualSession);
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

    // 1. Get or Create the Ledger account for this employee
    const emp = await Employee.findById(employeeId).populate('userid').session(session);
    if (!emp) throw new Error("Employee not found for ledger recording");

    let empLedger = await Ledger.findOne({ employeeId }).session(session);
    
    if (!empLedger) {
      empLedger = new Ledger({
        employeeId,
        empId: emp.empId,
        ledgerType: 'employee',
        companyId: companyId || emp.companyId,
        name: emp?.employeeName || emp?.userid?.name || 'Unknown',
        profileImage: emp?.profileimage,
        advance: 0
      });
      await empLedger.save({ session });
      
      // Link back to employee
      emp.ledgerId = empLedger._id;
      await emp.save({ session });
    }

    // 2. Atomic Update of Ledger and Employee Balances
    // CREDIT increases balance (Liability/Advance provided), DEBIT decreases it.
    const increment = type === 'CREDIT' ? amountNum : -amountNum;
    
    const updatedLedger = await Ledger.findByIdAndUpdate(
      empLedger._id,
      { $inc: { advance: increment } },
      { session, new: true, runValidators: true }
    );

    if (!updatedLedger) throw new Error("Failed to update ledger balance");

    // Sync back to employee summary
    await Employee.findByIdAndUpdate(employeeId, { advance: updatedLedger.advance }, { session });

    // 3. Create the Entry with the resulting running balance
    const newEntry = new Entry({
      ledgerId: updatedLedger._id,
      date,
      particular: remarks || `${type} for ${source}`,
      debit: type === 'DEBIT' ? amountNum : 0,
      credit: type === 'CREDIT' ? amountNum : 0,
      balance: updatedLedger.advance,
      source: source || 'ledger',
      referenceId: referenceId || voucherId,
      status: 'active'
    });

    await newEntry.save({ session });
    return newEntry;
  }

  /**
   * Reverse an existing ledger entry by creating a compensating transaction.
   * Part of the "Immutable Log" pattern.
   */
  async reverseEntry(entryId, remarks, session) {
    const originalEntry = await Entry.findById(entryId).session(session);
    if (!originalEntry) throw new Error("Entry not found");
    if (originalEntry.status === 'reversed') throw new Error("Entry is already reversed");

    const ledger = await Ledger.findById(originalEntry.ledgerId).session(session);
    if (!ledger) throw new Error("Ledger not found for entry");

    // Create the reversal (compensating) entry
    const type = originalEntry.credit > 0 ? 'DEBIT' : 'CREDIT';
    const amount = originalEntry.credit > 0 ? originalEntry.credit : originalEntry.debit;

    const reversalEntry = await this.recordLedgerEntry({
      employeeId: ledger.employeeId,
      companyId: ledger.companyId,
      type,
      amount,
      source: 'adjustment',
      remarks: remarks || `REVERSAL: ${originalEntry.particular}`,
      referenceId: originalEntry._id
    }, session);

    // Update original entry status and link to reversal
    originalEntry.status = 'reversed';
    originalEntry.reversalReference = reversalEntry._id;
    await originalEntry.save({ session });

    return reversalEntry;
  }

  async getEmployeeLedger(employeeId) {
    const empLedger = await Ledger.findOne({ employeeId });
    if (!empLedger) return { entries: [] };
    
    const entries = await Entry.find({ ledgerId: empLedger._id })
      .sort({ date: -1, _id: -1 })
      .populate('referenceId');
      
    return { ...empLedger.toObject(), entries };
  }

  /**
   * Directly update a ledger entry and propagate balance changes.
   * Ensures financial integrity by adjusting all subsequent entries.
   */
  async updateLedgerEntry(entryId, newData, session) {
    const originalEntry = await Entry.findById(entryId).session(session);
    if (!originalEntry) throw new Error("Entry not found");

    const ledger = await Ledger.findById(originalEntry.ledgerId).session(session);
    if (!ledger) throw new Error("Ledger not found");

    // 1. Calculate the delta
    const oldNet = (originalEntry.credit || 0) - (originalEntry.debit || 0);
    const newCredit = Number(newData.credit) || 0;
    const newDebit = Number(newData.debit) || 0;
    const newNet = newCredit - newDebit;
    
    const delta = newNet - oldNet;

    // 2. Update the current entry
    originalEntry.date = newData.date || originalEntry.date;
    originalEntry.particular = newData.particular || originalEntry.particular;
    originalEntry.debit = newDebit;
    originalEntry.credit = newCredit;
    originalEntry.balance += delta;
    await originalEntry.save({ session });

    // 3. Propagate to ALL subsequent entries
    const subsequentEntries = await Entry.find({
      ledgerId: ledger._id,
      $or: [
        { date: { $gt: originalEntry.date } },
        { date: originalEntry.date, _id: { $gt: originalEntry._id } }
      ]
    }).sort({ date: 1, _id: 1 }).session(session);

    for (const subEntry of subsequentEntries) {
      subEntry.balance += delta;
      await subEntry.save({ session });
    }

    // 4. Update the Ledger and Employee global balance
    if (delta !== 0) {
      ledger.advance += delta;
      await ledger.save({ session });

      if (ledger.employeeId) {
        const Employee = mongoose.model('employee');
        await Employee.findByIdAndUpdate(ledger.employeeId, { advance: ledger.advance }, { session });
      }
    }

    return originalEntry;
  }

  /**
   * Hard delete a ledger entry and propagate balance changes.
   */
  async deleteLedgerEntry(entryId, session) {
    const entryToDelete = await Entry.findById(entryId).session(session);
    if (!entryToDelete) throw new Error("Entry not found");

    const ledger = await Ledger.findById(entryToDelete.ledgerId).session(session);
    if (!ledger) throw new Error("Ledger not found");

    // 1. Calculate the delta (reversing the entry's effect)
    // If it was credit 100, net was +100. Delta to remove it is -100.
    const netEffect = (entryToDelete.credit || 0) - (entryToDelete.debit || 0);
    const delta = -netEffect;

    // 2. Propagate to ALL subsequent entries
    const subsequentEntries = await Entry.find({
      ledgerId: ledger._id,
      $or: [
        { date: { $gt: entryToDelete.date } },
        { date: entryToDelete.date, _id: { $gt: entryToDelete._id } }
      ]
    }).sort({ date: 1, _id: 1 }).session(session);

    for (const subEntry of subsequentEntries) {
      subEntry.balance += delta;
      await subEntry.save({ session });
    }

    // 3. Update the Ledger and Employee global balance
    if (delta !== 0) {
      ledger.advance += delta;
      await ledger.save({ session });

      if (ledger.employeeId) {
        const Employee = mongoose.model('employee');
        await Employee.findByIdAndUpdate(ledger.employeeId, { advance: ledger.advance }, { session });
      }
    }

    // 4. Hard Delete
    await Entry.findByIdAndDelete(entryId).session(session);

    return { success: true };
  }
}

module.exports = new AccountingService();
