const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, default: 0 }
  },
  { timestamps: true }
);

counterSchema.statics.getNextSequence = async function (sequenceName, session = null, padWidth = 0) {
  const options = { new: true, upsert: true };
  if (session) options.session = session;

  const counter = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence: 1 } },
    options
  );

  if (padWidth > 0) {
    return String(counter.sequence).padStart(padWidth, '0');
  }
  return counter.sequence;
};

module.exports = mongoose.model('Counter', counterSchema);
