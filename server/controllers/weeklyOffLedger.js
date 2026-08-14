const WeeklyOffLedger = require("../models/weeklyOffLedger");
const Employee = require("../models/employee");
const { rebuildAllWeeklyOffLedgers } = require("../services/weeklyOffService");

exports.getEmployeeLedger = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    // Direct, fast database query
    const ledger = await WeeklyOffLedger.find({ employeeId }).sort({ createdAt: -1 });

    // Sort chronologically by period (date, year, month, type rank, createdAt)
    const sortedChrono = [...ledger].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : (a.year && a.month ? new Date(a.year, a.month - 1).getTime() : new Date(a.createdAt).getTime());
      const timeB = b.date ? new Date(b.date).getTime() : (b.year && b.month ? new Date(b.year, b.month - 1).getTime() : new Date(b.createdAt).getTime());

      if (timeA !== timeB) return timeA - timeB;

      const rank = (type) => (type === 'EARNED' || type === 'MANUAL_ADD' ? 1 : 2);
      if (rank(a.type) !== rank(b.type)) return rank(a.type) - rank(b.type);

      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    let balance = 0;
    sortedChrono.forEach((item) => {
      if (item.type === "EARNED" || item.type === "MANUAL_ADD") {
        balance += item.minutes;
      } else if (item.type === "PAYROLL_PAID" || item.type === "MANUAL_DEDUCT") {
        balance -= item.minutes;
      }
    });

    return res.status(200).json({
      success: true,
      balance: Math.max(0, balance),
      ledger,
    });
  } catch (error) {
    console.error("Error fetching weekly off ledger:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.rebuildAll = async (req, res) => {
  try {
    const result = await rebuildAllWeeklyOffLedgers();
    return res.status(200).json({
      success: true,
      message: `Weekly Off Ledger rebuilt successfully for ${result.processedEmployees} employees!`,
      ...result
    });
  } catch (error) {
    console.error("Error rebuilding weekly off ledgers:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addManualEntry = async (req, res) => {
  try {
    const { employeeId, type, minutes, particulars, month, year } = req.body;

    if (!employeeId || !type || !minutes || !particulars) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    if (!['MANUAL_ADD', 'MANUAL_DEDUCT', 'EARNED', 'PAYROLL_PAID'].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid transaction type" });
    }

    const emp = await Employee.findById(employeeId);
    if (!emp) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const entry = await WeeklyOffLedger.create({
      employeeId,
      branchId: emp.branchId,
      type,
      minutes: Number(minutes),
      particulars,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      createdBy: req.user?.name || "Admin",
    });

    return res.status(201).json({
      success: true,
      message: "Weekly Off Ledger entry added successfully",
      entry,
    });
  } catch (error) {
    console.error("Error adding weekly off ledger entry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await WeeklyOffLedger.findById(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Ledger entry not found" });
    }

    await WeeklyOffLedger.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Weekly Off Ledger entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting weekly off ledger entry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
