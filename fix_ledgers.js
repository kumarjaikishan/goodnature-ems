const mongoose = require('mongoose');
const Ledger = require('./server/models/ledger');
const Entry = require('./server/models/entry');
const Employee = require('./server/models/employee');

async function fix() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ems');
    console.log('Connected to DB');

    const employees = await Employee.find();
    for (const emp of employees) {
      const ledgers = await Ledger.find({ employeeId: emp._id });
      if (ledgers.length > 1) {
        console.log(`Found ${ledgers.length} ledgers for employee ${emp.userid}`);
        const primary = ledgers[0];
        const duplicates = ledgers.slice(1);
        
        for (const dup of duplicates) {
          console.log(`Merging ledger ${dup._id} into ${primary._id}`);
          await Entry.updateMany({ ledgerId: dup._id }, { $set: { ledgerId: primary._id } });
          await Ledger.deleteOne({ _id: dup._id });
        }
        
        emp.ledgerId = primary._id;
        await emp.save();
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
