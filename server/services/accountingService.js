const Voucher = require('../models/voucher');
const Ledger = require('../models/ledger');
const Entry = require('../models/entry');
const mongoose = require('mongoose');
const { generateVoucherNo } = require('../utils/voucherHelper');

function toUtcDateOnly(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
    const Employee = mongoose.model('employee');
    const User = mongoose.model('User');
    const postingDate = toUtcDateOnly(date);

    // 1. Find the Ledger
    let empLedger;
    if (ledgerId) {
      empLedger = await Ledger.findById(ledgerId).session(session);
    } else if (employeeId) {
      empLedger = await Ledger.findOne({ employeeId }).session(session);
    } else if (sponsorId) {
      empLedger = await Ledger.findOne({ sponsorId }).session(session);
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

    if (!empLedger) throw new Error("Ledger account not found");

    // 2. Atomic Update of Ledger Balance
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

    const nextEntry = await Entry.findOne({
      ledgerId: updatedLedger._id,
      $or: [
        { date: { $gt: newEntry.date } },
        { date: newEntry.date, createdAt: { $gt: newEntry.createdAt } },
        { date: newEntry.date, createdAt: newEntry.createdAt, _id: { $gt: newEntry._id } }
      ]
    }).sort({ date: 1, createdAt: 1, _id: 1 }).session(session);

    if (!nextEntry) {
      newEntry.balance = updatedLedger.advance;
      await newEntry.save({ session });
      return newEntry;
    }

    const prevEntry = await Entry.findOne({
      ledgerId: updatedLedger._id,
      $or: [
        { date: { $lt: newEntry.date } },
        { date: newEntry.date, createdAt: { $lt: newEntry.createdAt } },
        { date: newEntry.date, createdAt: newEntry.createdAt, _id: { $lt: newEntry._id } }
      ]
    }).sort({ date: -1, createdAt: -1, _id: -1 }).session(session);

    const prevBalance = prevEntry?.balance || 0;
    newEntry.balance = prevBalance + netEffect;
    await newEntry.save({ session });

    await Entry.updateMany(
      {
        ledgerId: updatedLedger._id,
        $or: [
          { date: { $gt: newEntry.date } },
          { date: newEntry.date, createdAt: { $gt: newEntry.createdAt } },
          { date: newEntry.date, createdAt: newEntry.createdAt, _id: { $gt: newEntry._id } }
        ]
      },
      { $inc: { balance: netEffect } },
      { session }
    );

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

    // If date changes, the entry's position in the running-order can change.
    // In that case, a simple delta-propagation can corrupt balances.
    if (newData.date && new Date(newData.date).getTime() !== new Date(oldDate).getTime()) {
      const allEntries = await Entry.find({ ledgerId: ledger._id })
        .sort({ date: 1, createdAt: 1, _id: 1 })
        .session(session);

      let running = 0;
      const bulkOps = [];
      for (const e of allEntries) {
        running += (e.credit || 0) - (e.debit || 0);
        if (e.balance !== running) {
          bulkOps.push({ updateOne: { filter: { _id: e._id }, update: { $set: { balance: running } } } });
        }
      }
      if (bulkOps.length) {
        await Entry.bulkWrite(bulkOps, { session });
      }

      ledger.advance = running;
      await ledger.save({ session });

      if (ledger.employeeId) {
        const Employee = mongoose.model('employee');
        await Employee.findByIdAndUpdate(ledger.employeeId, { advance: ledger.advance }, { session });
      }

      return originalEntry;
    }

    // 3. Propagate to ALL subsequent entries
    // (mirrors the same shift used in recordLedgerEntry: a single bulk
    // update instead of fetching every subsequent entry and saving each
    // one individually - same result, one round trip instead of N)
    const subsequentFilter = {
      ledgerId: ledger._id,
      $or: [
        { date: { $gt: originalEntry.date } },
        { date: originalEntry.date, createdAt: { $gt: originalEntry.createdAt } },
        { date: originalEntry.date, createdAt: originalEntry.createdAt, _id: { $gt: originalEntry._id } }
      ]
    };
    if (delta !== 0) {
      await Entry.updateMany(subsequentFilter, { $inc: { balance: delta } }, { session });
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

    // 2. Propagate to ALL subsequent entries (single bulk update instead
    // of fetching + saving every subsequent entry one at a time)
    if (delta !== 0) {
      await Entry.updateMany(
        {
          ledgerId: ledger._id,
          $or: [
            { date: { $gt: entryToDelete.date } },
            { date: entryToDelete.date, createdAt: { $gt: entryToDelete.createdAt } },
            { date: entryToDelete.date, createdAt: entryToDelete.createdAt, _id: { $gt: entryToDelete._id } }
          ]
        },
        { $inc: { balance: delta } },
        { session }
      );
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
