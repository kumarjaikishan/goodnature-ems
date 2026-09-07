const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

let supportsTransactions = null;

const checkTransactionSupport = async () => {
  try {
    const topology = mongoose.connection.client?.topology?.description;
    const setName = topology?.setName;
    const type = topology?.type;

    if (setName || ['ReplicaSetWithPrimary', 'Sharded', 'LoadBalanced'].includes(type)) {
      supportsTransactions = true;
      return true;
    }

    // Ping check with transaction to verify if standalone instance supports transactions
    const session = await originalStartSession.call(mongoose);
    try {
      session.startTransaction();
      await mongoose.connection.db.admin().command({ ping: 1 }, { session });
      await session.abortTransaction();
      supportsTransactions = true;
    } catch (err) {
      supportsTransactions = false;
      console.log("ℹ️ Running on standalone MongoDB (Transactions safely bypassed for local development)");
    } finally {
      await session.endSession().catch(() => {});
    }
  } catch (err) {
    supportsTransactions = false;
  }
  return supportsTransactions;
};

const originalStartSession = mongoose.startSession;

mongoose.startSession = async function (...args) {
  if (supportsTransactions === null && mongoose.connection.readyState === 1) {
    await checkTransactionSupport();
  }

  const session = await originalStartSession.apply(this, args);

  if (supportsTransactions === false) {
    // Override transaction methods to safe no-ops on standalone MongoDB
    session.startTransaction = function () {
      // Safe no-op on standalone MongoDB
    };
    session.commitTransaction = async function () {
      // Safe no-op on standalone MongoDB
    };
    session.abortTransaction = async function () {
      // Safe no-op on standalone MongoDB
    };
  }

  return session;
};

mongoose.connect(process.env.db).then(async () => {
  console.log("connection to Mongodb successful");
  await checkTransactionSupport();
}).catch((e) => {
  console.log("MongoDB connection error:", e);
});
