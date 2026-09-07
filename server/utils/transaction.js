const mongoose = require('mongoose');

/**
 * Executes a function inside a MongoDB transaction if replica set transactions are supported.
 * Automatically falls back to standard execution if running on a standalone MongoDB instance.
 *
 * @param {Function} callback - async (session) => result
 * @returns {Promise<any>}
 */
const withTransaction = async (callback) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    // Standalone MongoDB does not support sessions/transactions
    session = null;
  }

  if (session) {
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      try {
        await session.abortTransaction();
      } catch (_) {}

      // If the error was due to standalone replica set limitation
      if (
        err?.message?.includes('replica set') ||
        err?.message?.includes('Transaction numbers') ||
        err?.codeName === 'IllegalOperation'
      ) {
        try {
          await session.endSession();
        } catch (_) {}
        // Fall back to executing operations without transaction session
        return await callback(null);
      }
      throw err;
    } finally {
      try {
        await session.endSession();
      } catch (_) {}
    }
  } else {
    return await callback(null);
  }
};

module.exports = { withTransaction };
