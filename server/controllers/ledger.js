const Ledger = require("../models/ledger");
const employee = require('../models/employee');
const Entry = require("../models/entry");
const fs = require("fs");
const accountingService = require('../services/accountingService');

const getEmployeeLedger = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const ledger = await accountingService.getEmployeeLedger(employeeId);
    return res.status(200).json(ledger);
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

const getMyLedger = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee profile not found" });
    }

    const emp = await employee.findById(employeeId);
    if (!emp?.allowSeeLedger) {
      return res.status(200).json([]);
    }
    let ledgerId = emp?.ledgerId;

    if (!ledgerId) {
      // Fallback: search Ledger model by employeeId (which might be the User ID in some cases)
      const ledgerAccount = await Ledger.findOne({ 
        $or: [
          { employeeId: employeeId },
          { employeeId: req.user.id }
        ]
      });
      ledgerId = ledgerAccount?._id;
    }

    if (!ledgerId) {
      return res.status(200).json([]);
    }

    // Fetch entries from the Entry model for this ledger account
    const entries = await Entry.find({ ledgerId }).sort({ date: 1, _id: 1 });
    
    // Map entries to the format expected by the new UI
    // Note: Balance = Debit - Credit from admin view.
    // For Employee POV, we show it consistently but can flip if needed.
    // User wants "look alike" LedgerDetailPage, so we provide exact fields.
    const formattedEntries = entries.map(entry => ({
      _id: entry._id,
      date: entry.date || entry.createdAt,
      particular: entry.particular,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      balance: entry.balance || 0
    }));

    return res.status(200).json(formattedEntries);
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

const removePhotoBySecureUrl = require("../utils/cloudinaryremove");
const { default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const createLedgerForEmployee = async (companyId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1️⃣ Find active employees without ledgerId (or verify their ledger exists)
    const employees = await employee.find(
      { companyId, status: true },
      null,
      { session }
    ).populate({
      path: 'userid',
      select: 'name'
    });

    for (const emp of employees) {
      let ledger = await Ledger.findOne({ employeeId: emp._id }).session(session);
      
      if (!ledger) {
        [ledger] = await Ledger.create(
          [
            {
              companyId: emp.companyId,
              name: emp?.employeeName || emp?.userid?.name || "Unknown",
              employeeId: emp._id,
              empId: emp.empId,
              profileImage: emp?.profileimage,
              ledgerType: 'employee'
            },
          ],
          { session }
        );
      } else {
        // Update existing ledger if needed (sync empId/name)
        let updated = false;
        if (ledger.empId !== emp.empId) { ledger.empId = emp.empId; updated = true; }
        if (ledger.ledgerType !== 'employee') { ledger.ledgerType = 'employee'; updated = true; }
        if (updated) await ledger.save({ session });
      }

      // Ensure employee record is linked
      if (!emp.ledgerId || emp.ledgerId.toString() !== ledger._id.toString()) {
        emp.ledgerId = ledger._id;
        await emp.save({ session });
      }
    }

    await session.commitTransaction();
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("Ledger creation error:", error);
  } finally {
    session.endSession();
  }
};

const ledger = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    // Auto-sync ledgers for active employees
    await createLedgerForEmployee(companyId);

    // Fetch all ledgers for this company/user
    const ledgers = await Ledger.find({
      companyId: companyId,
      $or: [
        { userId: req.userid }, // Ledgers created by this user
        { userId: { $exists: false } }, // Common ledgers
        { userId: null }
      ]
    }).populate({
      path: 'employeeId',
      select: 'status'
    });

    // Filter: Visible only if it's custom OR it's an active employee
    const visibleLedgers = ledgers.filter(l => {
      if (l.ledgerType === 'custom') return true;
      if (l.ledgerType === 'employee') {
        return l.employeeId && l.employeeId.status === true;
      }
      return true; // Fallback
    });

    const ledgersWithBalance = await Promise.all(
      visibleLedgers.map(async (ledger) => {
        const lastEntry = await Entry.findOne({ ledgerId: ledger._id })
          .sort({ date: -1, _id: -1 });

        return {
          ...ledger.toObject(),
          netBalance: lastEntry ? lastEntry.balance : 0
        };
      })
    );

    res.json({ ledgers: ledgersWithBalance });
  } catch (err) {
    console.error("Error fetching ledgers:", err);
    res.status(500).json({ error: "Failed to fetch ledgers" });
  }
};



const createLedger = async (req, res) => {
  try {
    const { name } = req.body;
    if (!req.userid) return res.status(400).json({ message: "Creating User is required." });

    const existing = await Ledger.findOne({ companyId: req.user.companyId, name, userId: req.userid });
    if (existing) {
      return res.status(400).json({ message: "Ledger with this name already exists." });
    }

    const ledger = new Ledger({ 
      companyId: req.user.companyId, 
      name, 
      userId: req.userid,
      ledgerType: 'custom' // Explicitly custom
    });

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'ems/ledger'
      });

      ledger.profileImage = uploadResult.secure_url;

      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting local file:", err.message);
      });
    }

    await ledger.save();
    res.status(201).json({ message: "Ledger created successfully." });

  } catch (err) {
    console.error("Ledger creation error:", err.message);
    res.status(500).json({ error: "Failed to create ledger", details: err.message });
  }
};

const updateLedger = async (req, res) => {
  try {
    const { name } = req.body;

    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    const profileImage = ledger.profileImage;

    // Handle image upload if file provided
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'ems/ledger'
      });

      ledger.profileImage = uploadResult.secure_url;

      // Delete temp file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting local file:", err.message);
      });

      // Optionally delete old image from Cloudinary
      if (profileImage && profileImage !== "") {
        await removePhotoBySecureUrl([profileImage]);
      }
    }

    // Update name
    if (name) {
      ledger.name = name;
    }
    await ledger.save();
    res.json({ message: "Ledger updated successfully" });

  } catch (err) {
    console.error("Ledger update error:", err.message);
    res.status(500).json({ error: "Failed to update ledger", details: err.message });
  }
};

const ledgerEntries = async (req, res) => {
  try {
    const ledgers = await Ledger.find({ userId: req.userid });
    const entries = await Entry.find({ userId: req.userid }).sort({ date: -1, _id: -1 });
    res.json({ ledgers, entries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ledgers" });
  }
};

const Entries = async (req, res) => {
  try {
    const entries = await Entry.find({ ledgerId: req.params.id }).sort({ date: -1, _id: -1 });

    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ledgers" });
  }
};

// Delete a ledger
const deleteLedger = async (req, res) => {
  try {
    const { id } = req.params;
    // Delete the ledger
    const deletedLedger = await Ledger.findByIdAndDelete(id);

    if (deletedLedger.profileImage && deletedLedger.profileImage !== "") {
      let arraye = [];
      arraye.push(deletedLedger.profileImage);
      await removePhotoBySecureUrl(arraye);
    }

    // Delete all related entries
    await Entry.deleteMany({ ledgerId: id });
    res.json({ message: "Ledger deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete ledger" });
  }
};

// Helper: Recalculate balances (DEPRECATED - Use AccountingService atomic updates)
const recalculateBalances = async (ledgerId, userId) => {
  console.warn("recalculateBalances called - This is deprecated and logic should move to AccountingService");
};

// Create entry
const createEntry = async (req, res) => {
  try {
    const { ledgerId, date, particular, debit, credit } = req.body;

    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) return res.status(404).json({ error: "Ledger not found" });

    const type = Number(credit) > 0 ? 'CREDIT' : 'DEBIT';
    const amount = Number(credit) > 0 ? credit : debit;

    await accountingService.recordLedgerEntry({
      employeeId: ledger.employeeId,
      companyId: req.user.companyId,
      date: new Date(date),
      type,
      amount,
      source: 'manual',
      remarks: particular
    });

    res.status(201).json({ message: "Entry Created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create entry", details: err.message });
  }
};

// Update entry (DISABLED for Audit Integrity)
const updateEntry = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    const { date, particular, debit, credit } = req.body;

    const entry = await Entry.findById(id).session(session);
    if (!entry) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Entry not found" });
    }
    if (entry.source === "payroll" || entry.source === "salary") {
      await session.abortTransaction();
      return res.status(400).json({ error: "This entry belongs to a payroll salary voucher and cannot be edited directly from the ledger." });
    }

    const updatedEntry = await accountingService.updateLedgerEntry(id, {
      date,
      particular,
      debit,
      credit
    }, session);

    await session.commitTransaction();
    res.status(200).json({ 
      message: "Entry updated successfully. Balances have been recalculated.",
      entry: updatedEntry 
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Entry update error:", err);
    res.status(500).json({ error: "Failed to update entry", details: err.message });
  } finally {
    session.endSession();
  }
};

// Delete entry (Hard delete with balance propagation)
const deleteEntry = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    
    const entry = await Entry.findById(id).session(session);
    if (!entry) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Entry not found" });
    }
    if (entry.source === "payroll" || entry.source === "salary") {
      await session.abortTransaction();
      return res.status(400).json({ error: "This entry belongs to a payroll salary voucher and cannot be deleted directly from the ledger." });
    }

    await accountingService.deleteLedgerEntry(id, session);
    
    await session.commitTransaction();
    res.status(200).json({ message: "Entry deleted and balances recalculated successfully" });
  } catch (err) {
    await session.abortTransaction();
    console.error("Entry deletion error:", err);
    res.status(500).json({ error: "Failed to delete entry", details: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Unified entry point to record ANY financial transaction for an employee.
 * This ensures the ledger is always consistent and balances are correct.
 * Proxy to AccountingService for centralized logic.
 */
const recordLedgerEntry = async (data, session = null) => {
  return await accountingService.recordLedgerEntry(data, session);
};

// ... (rest of the file remains similar but uses recordLedgerEntry where appropriate)
// I'll keep the exported functions but refactor them slightly if needed.

module.exports = {
  recordLedgerEntry, // Exported for use in other controllers
  getEmployeeLedger,
  createLedger,
  updateLedger,
  ledgerEntries,
  ledger,
  Entries,
  deleteLedger,
  createEntry,
  updateEntry,
  deleteEntry,
  recalculateBalances,
  getMyLedger
};
