const mongoose = require('mongoose');
const Entry = require('./server/models/entry');
const Ledger = require('./server/models/ledger');
const Employee = require('./server/models/employee');

async function check() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ems');
    console.log('Connected to DB');

    const ledgers = await Ledger.find().populate('employeeId');
    console.log('--- Ledgers ---');
    ledgers.forEach(l => {
        console.log(`Ledger: ${l.name}, EmployeeID: ${l.employeeId?._id}, LedgerID: ${l._id}, userId: ${l.userId}`);
    });

    const entries = await Entry.find().sort({ createdAt: -1 }).limit(10);
    console.log('--- Recent Entries ---');
    entries.forEach(e => {
        console.log(`Entry: ${e.particular}, LedgerID: ${e.ledgerId}, Debit: ${e.debit}, Credit: ${e.credit}, Source: ${e.source}`);
    });

    const employees = await Employee.find().limit(5);
    console.log('--- Employees ---');
    employees.forEach(emp => {
        console.log(`Employee: ${emp.empId}, LedgerId: ${emp.ledgerId}, Advance: ${emp.advance}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
