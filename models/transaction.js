import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  blockNumber: { type: Number, required: true },
  blockNumberString: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  value: { type: Number, required: true },
  confirmations: { type: Number, default: 0 },
  sentAt: { type: Date, required: true },
  fee: { type: String, required: true },
});

// eslint-disable-next-line import/prefer-default-export
export const Transaction = mongoose.model('Transaction', transactionSchema);
