import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);