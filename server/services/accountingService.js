const Voucher = require('../models/voucher');
const Ledger = require('../models/ledger');
const Entry = require('../models/entry');
const Employee = require('../models/employee');
const User = require('../models/user');
const Branch = require('../models/branch');
const mongoose = require('mongoose');
const { generateVoucherNo } = require('../utils/voucherHelper');

function toUtcDateOnly(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Generates strict chronological sort/filter criteria on (date, createdAt, _id).
 * Guarantees identical order matching the compound index and avoids duplicate query logic.
 *
 * @param {mongoose.Types.ObjectId} ledgerId
 * @param {Object} entry - The pivot entry with { date, createdAt, _id }
 * @param {'before'|'after'} direction
 */
function _chronoFilter(ledgerId, entry, direction = 'before') {
  const op = direction === 'before' ? '$lt' : '$gt';
  return {
    ledgerId,
    _id: { $ne: entry._id },
    $or: [
      { date: { [op]: entry.date } },
      { date: entry.date, createdAt: { [op]: entry.createdAt } },
      { date: entry.date, createdAt: entry.createdAt, _id: { [op]: entry._id } }
    ]
  };
}

/**
 * Synchronizes the final running balance of a ledger to Ledger.advance
 * and Employee.advance (if employee ledger).
 *
 * @param {mongoose.Types.ObjectId} ledgerId
 * @param {mongoose.ClientSession|null} session
 */
async function _syncLedgerFinalBalance(ledgerId, session = null) {
  if (!ledgerId) return 0;
  const lastEntry = await Entry.findOne({ ledgerId })
    .sort({ date: -1, createdAt: -1, _id: -1 })
    .session(session);

  const finalBalance = lastEntry ? (Number(lastEntry.balance) || 0) : 0;

  const ledger = await Ledger.findByIdAndUpdate(
    ledgerId,
    { $set: { advance: finalBalance } },
    { session, new: true }
  );

  if (ledger?.ledgerType === 'employee' && ledger.employeeId) {
    await Employee.findByIdAndUpdate(ledger.employeeId, { advance: finalBalance }, { session });
  }

  return finalBalance;
}

class AccountingService {
  /**
   * Create a voucher and corresponding ledger entries
   * @param {Object} voucherData 
   * @param {mongoose.ClientSession} session 
   */
  async createVoucher(voucherData, session) {
    const { type, employeeId, entries, referenceType, referenceId, remarks, branchId, date } = voucherData;

    // Generate Voucher Number
    const voucherNo = await generateVoucherNo(date || new Date(), session);

    const voucher = new Voucher({
      branchId,
      voucherNo,
      type,
      employeeId,
      date: date || new Date(),
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
             branchId,
             date: date || new Date(),
             type: entry.type, 
             amount: entry.amount,
             source: (referenceType || 'voucher').toLowerCase(),
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
  async syncSalaryVoucher(voucherId, newEntries, remarks, postingDate, session) {
    if (!voucherId) return;

    let actualSession = session;
    let actualRemarks = remarks;
    let actualPostingDate = postingDate;

    if (postingDate && typeof postingDate === 'object' && postingDate.constructor?.name === 'ClientSession') {
      actualSession = postingDate;
      actualPostingDate = undefined;
    }
    if (remarks && typeof remarks === 'object' && remarks.constructor?.name === 'ClientSession') {
      actualSession = remarks;
      actualRemarks = undefined;
      actualPostingDate = undefined;
    }

    const voucher = await Voucher.findById(voucherId).session(actualSession);
    if (!voucher) return;

    // 1. Update Voucher Document entries and remarks
    voucher.entries = newEntries;
    if (actualPostingDate) voucher.date = actualPostingDate;
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
      const payableEntry = newEntries.find(e => 
        e.accountName.toLowerCase().includes('payable') || 
        e.accountName.toLowerCase().includes('employee')
      );
      const newAmount = payableEntry ? payableEntry.amount : 0;
      
      await this.updateLedgerEntry(entry._id, {
        credit: entry.debit > 0 ? 0 : newAmount,
        debit: entry.debit > 0 ? newAmount : 0,
        particular: voucher.remarks + " (Edited)",
        date: actualPostingDate || entry.date
      }, actualSession);
    }
  }

  async recordLedgerEntry(data, session = null) {
    const { 
      employeeId, 
      sponsorId,
      branchId,
      ledgerId,
      date = new Date(), 
      type, // 'DEBIT' or 'CREDIT'
      amount, 
      source, 
      referenceId, 
      remarks,
      voucherId 
    } = data;

    const amountNum = Number(amount) || 0;
    const postingDate = toUtcDateOnly(date);

    // 1. Find the Ledger
    let empLedger;
    if (ledgerId) {
      empLedger = await Ledger.findById(ledgerId).session(session);
    } else if (employeeId) {
      empLedger = await Ledger.findOne({ employeeId }).session(session);
    } else if (sponsorId) {
      empLedger = await Ledger.findOne({ sponsorId }).session(session);
    } else if (branchId) {
      empLedger = await Ledger.findOne({ branchId }).session(session);
    }

    // Create ledger for employee if it doesn't exist yet
    if (!empLedger && employeeId) {
      const emp = await Employee.findById(employeeId).populate('userid').session(session);
      if (emp) {
        empLedger = new Ledger({
          employeeId,
          empId: emp.empId,
          ledgerType: 'employee',
          name: emp?.employeeName || emp?.userid?.name || 'Unknown',
          profileImage: emp?.profileimage,
          advance: 0
        });
        await empLedger.save({ session });
        
        // Link back to employee
        emp.ledgerId = empLedger._id;
        await emp.save({ session });
      }
    }

    // Create ledger for sponsor if it doesn't exist yet
    if (!empLedger && sponsorId) {
      const sponsor = await User.findById(sponsorId).session(session);
      if (sponsor) {
        empLedger = new Ledger({
          sponsorId: sponsor._id,
          empId: sponsor.sponsorCode || '',
          ledgerType: 'sponsor',
          name: sponsor.name || 'Sponsor',
          profileImage: sponsor.profileImage,
          isVoucherLedger: true,
          advance: 0
        });
        await empLedger.save({ session });
      }
    }

    // Create ledger for branch if it doesn't exist yet
    if (!empLedger && branchId) {
      const branch = await Branch.findById(branchId).session(session);
      if (branch) {
        empLedger = new Ledger({
          branchId: branch._id,
          empId: branch.branchCode || `BR-${branch.name.slice(0, 3).toUpperCase()}`,
          ledgerType: 'branch',
          name: `${branch.name} BRANCH`,
          isVoucherLedger: true,
          advance: 0
        });
        await empLedger.save({ session });
      }
    }

    if (!empLedger) throw new Error("Ledger account not found");

    // 2. Atomic Update of Ledger Balance (Transaction write lock)
    const netEffect = type === 'CREDIT' ? amountNum : -amountNum;
    
    const updatedLedger = await Ledger.findByIdAndUpdate(
      empLedger._id,
      { $inc: { advance: netEffect } },
      { session, new: true, runValidators: true }
    );

    if (!updatedLedger) throw new Error("Failed to update ledger balance");

    // Sync back to employee summary if it is an employee ledger
    if (updatedLedger.ledgerType === 'employee' && updatedLedger.employeeId) {
      await Employee.findByIdAndUpdate(updatedLedger.employeeId, { advance: updatedLedger.advance }, { session });
    }

    // 3. Create the Entry
    const newEntry = new Entry({
      ledgerId: updatedLedger._id,
      date: postingDate,
      particular: remarks || `${type} for ${source}`,
      debit: type === 'DEBIT' ? amountNum : 0,
      credit: type === 'CREDIT' ? amountNum : 0,
      balance: 0,
      source: source || 'ledger',
      referenceId: referenceId || voucherId,
      status: 'active'
    });

    await newEntry.save({ session });

    // Always find the immediately preceding entry in chronological sort order
    const prevEntry = await Entry.findOne(
      _chronoFilter(updatedLedger._id, newEntry, 'before')
    ).sort({ date: -1, createdAt: -1, _id: -1 }).session(session);

    const prevBalance = prevEntry ? (Number(prevEntry.balance) || 0) : 0;
    newEntry.balance = Math.round((prevBalance + netEffect) * 100) / 100;
    await newEntry.save({ session });

    // Propagate netEffect to all subsequent entries
    const updateResult = await Entry.updateMany(
      _chronoFilter(updatedLedger._id, newEntry, 'after'),
      { $inc: { balance: netEffect } },
      { session }
    );

    // Sync final balance
    if (updateResult && updateResult.matchedCount > 0) {
      await _syncLedgerFinalBalance(updatedLedger._id, session);
    } else {
      await Ledger.findByIdAndUpdate(
        updatedLedger._id,
        { $set: { advance: newEntry.balance } },
        { session }
      );
      if (updatedLedger.ledgerType === 'employee' && updatedLedger.employeeId) {
        await Employee.findByIdAndUpdate(updatedLedger.employeeId, { advance: newEntry.balance }, { session });
      }
    }

    return newEntry;
  }

  async reverseEntry(entryId, remarks, session) {
    const originalEntry = await Entry.findById(entryId).session(session);
    if (!originalEntry) throw new Error("Entry not found");
    if (originalEntry.status === 'reversed') throw new Error("Entry is already reversed");

    const ledger = await Ledger.findById(originalEntry.ledgerId).session(session);
    if (!ledger) throw new Error("Ledger not found for entry");

    const type = originalEntry.credit > 0 ? 'DEBIT' : 'CREDIT';
    const amount = originalEntry.credit > 0 ? originalEntry.credit : originalEntry.debit;

    const reversalEntry = await this.recordLedgerEntry({
      ledgerId: ledger._id,
      employeeId: ledger.employeeId,
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
      .sort({ date: -1, createdAt: -1, _id: -1 })
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

    const oldDate = originalEntry.date;
    const targetDate = newData.date ? toUtcDateOnly(newData.date) : originalEntry.date;

    // 1. Calculate the delta
    const oldNet = (originalEntry.credit || 0) - (originalEntry.debit || 0);
    const newCredit = newData.credit !== undefined ? (Number(newData.credit) || 0) : (originalEntry.credit || 0);
    const newDebit = newData.debit !== undefined ? (Number(newData.debit) || 0) : (originalEntry.debit || 0);
    const newNet = newCredit - newDebit;
    
    const delta = Math.round((newNet - oldNet) * 100) / 100;

    // 2. Update the current entry
    originalEntry.date = targetDate;
    originalEntry.particular = newData.particular || originalEntry.particular;
    originalEntry.debit = newDebit;
    originalEntry.credit = newCredit;
    originalEntry.balance = Math.round((originalEntry.balance + delta) * 100) / 100;
    await originalEntry.save({ session });

    // If date changes, the entry's position in the running-order can change.
    if (newData.date && new Date(targetDate).getTime() !== new Date(oldDate).getTime()) {
      await this.recalculateLedgerBalance(ledger._id, session);
      return originalEntry;
    }

    // 3. Propagate to ALL subsequent entries
    if (delta !== 0) {
      await Entry.updateMany(_chronoFilter(ledger._id, originalEntry, 'after'), { $inc: { balance: delta } }, { session });
    }

    // 4. Update the Ledger and Employee global balance
    await _syncLedgerFinalBalance(ledger._id, session);

    return originalEntry;
  }

  /**
   * Hard delete a ledger entry and propagate balance changes.
   */
  async deleteLedgerEntry(entryId, session) {
    if (!entryId) return null;
    const query = Entry.findById(entryId);
    if (session) query.session(session);
    const entryToDelete = await query;
    if (!entryToDelete) return null;

    const ledger = await Ledger.findById(entryToDelete.ledgerId).session(session);
    if (!ledger) throw new Error("Ledger not found");

    // 1. Calculate the delta (reversing the entry's effect)
    const netEffect = (entryToDelete.credit || 0) - (entryToDelete.debit || 0);
    const delta = Math.round((-netEffect) * 100) / 100;

    // 2. Propagate to ALL subsequent entries
    if (delta !== 0) {
      await Entry.updateMany(_chronoFilter(ledger._id, entryToDelete, 'after'), { $inc: { balance: delta } }, { session });
    }

    // 3. Hard Delete
    await Entry.findByIdAndDelete(entryId).session(session);

    // 4. Update the Ledger and Employee global balance
    await _syncLedgerFinalBalance(ledger._id, session);

    return { success: true };
  }

  /**
   * Fully recalculates running balances for all entries of a ledger
   * in strict chronological order and syncs ledger.advance.
   */
  async recalculateLedgerBalance(ledgerId, session = null) {
    if (!ledgerId) return 0;
    const query = Entry.find({ ledgerId }).sort({ date: 1, createdAt: 1, _id: 1 });
    if (session) query.session(session);
    const allEntries = await query;

    let running = 0;
    const bulkOps = [];
    for (const e of allEntries) {
      running = Math.round((running + (Number(e.credit) || 0) - (Number(e.debit) || 0)) * 100) / 100;
      if (e.balance !== running) {
        bulkOps.push({
          updateOne: {
            filter: { _id: e._id },
            update: { $set: { balance: running } }
          }
        });
      }
    }
    if (bulkOps.length > 0) {
      await Entry.bulkWrite(bulkOps, session ? { session } : {});
    }

    await _syncLedgerFinalBalance(ledgerId, session);

    return running;
  }
}

module.exports = new AccountingService();
