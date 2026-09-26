const Ledger = require("../models/ledger");
const employee = require('../models/employee');
const Entry = require("../models/entry");
const KisanSeller = require('../models/KisanSeller');
const KisanLandAgreement = require('../models/KisanLandAgreement');
const KisanLedger = require('../models/KisanLedger');
const fs = require("fs");
const accountingService = require('../services/accountingService');
const { withTransaction } = require('../utils/transaction');

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

    // Fetch entries (latest-first; stable ordering for same-day entries)
    const entries = await Entry.find({ ledgerId }).sort({ date: -1, createdAt: -1, _id: -1 });
    
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

const createLedgerForEmployee = async () => {
  return await withTransaction(async (session) => {
    const employees = await employee.find(
      { status: true },
      null,
      session ? { session } : {}
    ).populate({
      path: 'userid',
      select: 'name'
    });

    for (const emp of employees) {
      const q = Ledger.findOne({ employeeId: emp._id });
      if (session) q.session(session);
      let ledger = await q;
      
      if (!ledger) {
        const [newLedger] = await Ledger.create(
          [
            {
              name: emp?.employeeName || emp?.userid?.name || "Unknown",
              employeeId: emp._id,
              empId: emp.empId,
              profileImage: emp?.profileimage,
              ledgerType: 'employee'
            },
          ],
          session ? { session } : {}
        );
        ledger = newLedger;
      } else {
        let updated = false;
        if (ledger.empId !== emp.empId) { ledger.empId = emp.empId; updated = true; }
        if (ledger.ledgerType !== 'employee') { ledger.ledgerType = 'employee'; updated = true; }
        if (updated) await ledger.save(session ? { session } : {});
      }

      if (!emp.ledgerId || emp.ledgerId.toString() !== ledger._id.toString()) {
        emp.ledgerId = ledger._id;
        await emp.save(session ? { session } : {});
      }
    }
  });
};

const createLedgerForSponsors = async () => {
  return await withTransaction(async (session) => {
    const User = mongoose.model('User');
    const sponsors = await User.find(
      { role: { $in: ['sponsor', 'agent'] } },
      null,
      session ? { session } : {}
    );

    for (const sp of sponsors) {
      const q = Ledger.findOne({ sponsorId: sp._id });
      if (session) q.session(session);
      let ledger = await q;

      if (!ledger) {
        const [newLedger] = await Ledger.create(
          [
            {
              name: sp.name || "Business Developer",
              sponsorId: sp._id,
              empId: sp.sponsorCode || sp.customerId || "",
              profileImage: sp.profileImage || sp.photo || "",
              ledgerType: 'sponsor',
              isVoucherLedger: true
            },
          ],
          session ? { session } : {}
        );
        ledger = newLedger;
      } else {
        let updated = false;
        if (ledger.empId !== (sp.sponsorCode || sp.customerId || "")) { 
          ledger.empId = sp.sponsorCode || sp.customerId || ""; 
          updated = true; 
        }
        if (ledger.name !== sp.name) {
          ledger.name = sp.name;
          updated = true;
        }
        if (sp.profileImage && ledger.profileImage !== sp.profileImage) {
          ledger.profileImage = sp.profileImage;
          updated = true;
        }
        if (ledger.ledgerType !== 'sponsor') { 
          ledger.ledgerType = 'sponsor'; 
          updated = true; 
        }
        if (ledger.isVoucherLedger !== true) {
          ledger.isVoucherLedger = true;
          updated = true;
        }
        if (updated) await ledger.save(session ? { session } : {});
      }

      if (!sp.ledgerId || sp.ledgerId.toString() !== ledger._id.toString()) {
        sp.ledgerId = ledger._id;
        await sp.save(session ? { session } : {});
      }
    }
  });
};

const createLedgerForKisans = async () => {
  return await withTransaction(async (session) => {
    // 1. Ensure all farmers from KisanLandAgreement exist in KisanSeller
    const agreements = await KisanLandAgreement.find({}, null, session ? { session } : {});
    for (const agr of agreements) {
      if (Array.isArray(agr.farmers) && agr.farmers.length > 0) {
        for (const f of agr.farmers) {
          if (!f.name) continue;
          const cleanName = f.name.trim();
          const cleanMobile = f.mobile ? f.mobile.trim() : '';
          const cleanPan = f.panNumber ? f.panNumber.trim().toUpperCase() : '';

          const q = KisanSeller.findOne({
            $or: [
              ...(cleanPan ? [{ panNumber: cleanPan }] : []),
              ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
              { name: new RegExp(`^${cleanName}$`, 'i') }
            ]
          });
          if (session) q.session(session);
          let seller = await q;

          if (!seller) {
            const [newSeller] = await KisanSeller.create(
              [
                {
                  name: cleanName,
                  guardianName: f.guardianName || '',
                  relation: f.relation || 'Father',
                  mobile: cleanMobile,
                  aadhaarNumber: f.aadhaarNumber || '',
                  panNumber: cleanPan,
                  address: f.address || '',
                  bankDetails: f.bankDetails || {}
                }
              ],
              session ? { session } : {}
            );
            seller = newSeller;
          }
        }
      }
    }

    // 2. Ensure all KisanSellers have a Ledger account
    const sellers = await KisanSeller.find({}, null, session ? { session } : {});
    for (const seller of sellers) {
      const lq = Ledger.findOne({
        $or: [
          { kisanSellerId: seller._id },
          ...(seller.panNumber ? [{ empId: seller.panNumber, ledgerType: 'kisan' }] : []),
          ...(seller.mobile ? [{ empId: seller.mobile, ledgerType: 'kisan' }] : []),
          { name: seller.name, ledgerType: 'kisan' }
        ]
      });
      if (session) lq.session(session);
      let ledger = await lq;

      if (!ledger) {
        const [newLedger] = await Ledger.create(
          [
            {
              name: seller.name || "Kisan Seller",
              kisanSellerId: seller._id,
              empId: seller.panNumber || seller.mobile || "",
              ledgerType: 'kisan',
              isVoucherLedger: false
            },
          ],
          session ? { session } : {}
        );
        ledger = newLedger;
      } else {
        let updated = false;
        if (!ledger.kisanSellerId) {
          ledger.kisanSellerId = seller._id;
          updated = true;
        }
        if (ledger.name !== seller.name) {
          ledger.name = seller.name;
          updated = true;
        }
        const expectedEmpId = seller.panNumber || seller.mobile || "";
        if (expectedEmpId && ledger.empId !== expectedEmpId) {
          ledger.empId = expectedEmpId;
          updated = true;
        }
        if (ledger.ledgerType !== 'kisan') {
          ledger.ledgerType = 'kisan';
          updated = true;
        }
        if (updated) await ledger.save(session ? { session } : {});
      }

      // 3. Sync KisanLedger entries for this seller/farmer into Entry collection
      const kisanLedgerQuery = {
        $or: [
          { farmerId: seller._id },
          ...(seller.mobile ? [{ farmerMobile: seller.mobile }] : []),
          { farmerName: new RegExp(`^${seller.name}$`, 'i') }
        ]
      };

      const kq = KisanLedger.find(kisanLedgerQuery).sort({ date: 1, createdAt: 1 });
      if (session) kq.session(session);
      const kEntries = await kq;

      for (const k of kEntries) {
        const eq = Entry.findOne({
          $or: [
            { referenceId: k._id },
            {
              ledgerId: ledger._id,
              credit: k.type === 'CREDIT' ? k.amount : 0,
              debit: k.type === 'DEBIT' ? k.amount : 0,
              source: k.type === 'CREDIT' ? 'kisan_agreement' : 'kisan_payment'
            }
          ]
        });
        if (session) eq.session(session);
        const existingEntry = await eq;

        if (!existingEntry) {
          const newEntry = new Entry({
            ledgerId: ledger._id,
            date: k.date || new Date(),
            particular: k.remarks || (k.type === 'CREDIT' ? `Agreed Land Value - Agreement #${k.agreementNumber}` : `Payment to Kisan - Ref: ${k.receiptNumber || k.transactionReference || ''}`),
            debit: k.type === 'DEBIT' ? k.amount : 0,
            credit: k.type === 'CREDIT' ? k.amount : 0,
            balance: 0,
            source: k.type === 'CREDIT' ? 'kisan_agreement' : 'kisan_payment',
            referenceId: k._id,
            status: 'active'
          });
          await newEntry.save(session ? { session } : {});
        }
      }

      // 4. Recalculate running balances for this seller's ledger entries
      const aeq = Entry.find({ ledgerId: ledger._id }).sort({ date: 1, createdAt: 1, _id: 1 });
      if (session) aeq.session(session);
      const allEntries = await aeq;
      let running = 0;
      for (const e of allEntries) {
        running += (e.credit || 0) - (e.debit || 0);
        if (e.balance !== running) {
          e.balance = running;
          await e.save(session ? { session } : {});
        }
      }
      if (ledger.advance !== running) {
        ledger.advance = running;
        await ledger.save(session ? { session } : {});
      }
    }
  });
};

const ledger = async (req, res) => {
  try {
    await createLedgerForEmployee();
    await createLedgerForSponsors();
    await createLedgerForKisans();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 0;

    let filter = {
      $or: [
        { ledgerType: 'custom' },
        { ledgerType: 'employee' },
        { ledgerType: 'sponsor' },
        { ledgerType: 'kisan' },
        { userId: req.userid },
        { userId: { $exists: false } },
        { userId: null }
      ]
    };

    let query = Ledger.find(filter)
      .populate({
        path: 'employeeId',
        select: 'status employeeName empId profileimage'
      })
      .populate({
        path: 'kisanSellerId',
        select: 'name mobile panNumber aadhaarNumber address'
      })
      .populate({
        path: 'sponsorId',
        select: 'name sponsorCode customerId email mobile role sponsorId branchIds photo profileImage',
        populate: [
          { path: 'sponsorId', select: 'name sponsorCode role' },
          { path: 'branchIds', select: 'name location branchCode' }
        ]
      });

    const { view } = req.query;

    const ledgers = await query;

    const visibleLedgers = ledgers.filter(l => {
      const type = l.ledgerType || (l.employeeId ? 'employee' : (l.sponsorId ? 'sponsor' : (l.kisanSellerId ? 'kisan' : 'custom')));
      if (type === 'custom') {
        if (view === 'ledger') {
          return l.isVoucherLedger !== true;
        }
        if (view === 'vouchers') {
          return l.isVoucherLedger === true;
        }
        return true;
      }
      if (type === 'employee') {
        return l.employeeId && l.employeeId.status === true;
      }
      if (type === 'sponsor') {
        return Boolean(l.sponsorId);
      }
      if (type === 'kisan') {
        return Boolean(l.kisanSellerId);
      }
      return true;
    });

    let total = visibleLedgers.length;
    let pages = limit > 0 ? Math.ceil(total / limit) : 1;
    let slicedLedgers = visibleLedgers;
    if (limit > 0) {
      slicedLedgers = visibleLedgers.slice((page - 1) * limit, page * limit);
    }

    const ledgersWithBalance = await Promise.all(
      slicedLedgers.map(async (ledger) => {
        const lastEntry = await Entry.findOne({ ledgerId: ledger._id })
          .sort({ date: -1, createdAt: -1, _id: -1 });

        return {
          ...ledger.toObject(),
          netBalance: lastEntry ? lastEntry.balance : 0
        };
      })
    );

    res.json({ 
      ledgers: ledgersWithBalance,
      ...(limit > 0 ? { pagination: { page, limit, total, pages } } : {})
    });
  } catch (err) {
    console.error("Error fetching ledgers:", err);
    res.status(500).json({ error: "Failed to fetch ledgers" });
  }
};

const createLedger = async (req, res) => {
  try {
    const { name, isVoucherLedger } = req.body;
    if (!req.userid) return res.status(400).json({ message: "Creating User is required." });

    const existing = await Ledger.findOne({ name, userId: req.userid });
    if (existing) {
      return res.status(400).json({ message: "Ledger with this name already exists." });
    }

    const ledger = new Ledger({ 
      name, 
      userId: req.userid,
      ledgerType: 'custom',
      isVoucherLedger: isVoucherLedger === 'true' || isVoucherLedger === true ? true : false
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
        folder: 'ems/ledger',
        format: 'webp',
        transformation: [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
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
    const entries = await Entry.find({ userId: req.userid }).sort({ date: -1, createdAt: -1, _id: -1 });
    res.json({ ledgers, entries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ledgers" });
  }
};

const Entries = async (req, res) => {
  try {
    let ledgerId = req.params.id;

    // Check if req.params.id is a Ledger _id
    let ledgerExists = await Ledger.findById(ledgerId);
    if (!ledgerExists) {
      // Fallback: check if id is sponsorId, employeeId, or kisanSellerId
      const foundLedger = await Ledger.findOne({
        $or: [
          { sponsorId: ledgerId },
          { employeeId: ledgerId },
          { kisanSellerId: ledgerId }
        ]
      });
      if (foundLedger) {
        ledgerId = foundLedger._id;
      }
    }

    const entries = await Entry.find({ ledgerId }).sort({ date: -1, createdAt: -1, _id: -1 });

    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ledgers" });
  }
};

// Delete a ledger
const deleteLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLedger = await Ledger.findByIdAndDelete(id);

    if (!deletedLedger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    if (deletedLedger.profileImage && deletedLedger.profileImage !== "") {
      await removePhotoBySecureUrl([deletedLedger.profileImage]);
    }

    await Entry.deleteMany({ ledgerId: id });
    res.json({ message: "Ledger deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete ledger" });
  }
};

const recalculateBalances = async (ledgerId, userId) => {
  console.warn("recalculateBalances called - Deprecated");
};

const createEntry = async (req, res) => {
  try {
    const { ledgerId, date, particular, debit, credit } = req.body;

    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) return res.status(404).json({ error: "Ledger not found" });

    const type = Number(credit) > 0 ? 'CREDIT' : 'DEBIT';
    const amount = Number(credit) > 0 ? credit : debit;

    await accountingService.recordLedgerEntry({
      ledgerId: ledger._id,
      employeeId: ledger.employeeId,
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
    if (entry.source === "payroll" || entry.source === "salary" || (entry.source && entry.source.startsWith("commission")) || entry.source === "plot_payout") {
      await session.abortTransaction();
      return res.status(400).json({ error: "This entry belongs to an automated billing commission / payroll voucher and cannot be edited directly from the ledger." });
    }

    const updatedEntry = await accountingService.updateLedgerEntry(id, {
      date,
      particular,
      debit,
      credit
    }, session);

    await session.commitTransaction();
    res.status(200).json({ 
      message: "Updated successfully.",
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
    if (entry.source === "payroll" || entry.source === "salary" || (entry.source && entry.source.startsWith("commission")) || entry.source === "plot_payout") {
      await session.abortTransaction();
      return res.status(400).json({ error: "This entry belongs to an automated billing commission / payroll voucher and cannot be deleted directly from the ledger." });
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
