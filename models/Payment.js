const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maintenance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance',
    required: true
  },
  flatNumber: {
    type: String,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  lateFee: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'upi'],
    default: 'cash'
  },
  transactionId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  remarks: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  month: { type: Number, required: true },
  year: { type: Number, required: true }
}, { timestamps: true });

paymentSchema.index({ member: 1, maintenance: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);