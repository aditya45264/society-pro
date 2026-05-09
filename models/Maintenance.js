const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  lateFee: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  extraCharges: [{
    label: String,
    amount: Number
  }]
}, { timestamps: true });

maintenanceSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);