const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const { protect, committee } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const isCommittee = ['secretary', 'treasurer', 'chairman'].includes(req.user.role);
    const filter = isCommittee ? {} : { member: req.user._id };
    const { month, year, status } = req.query;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    const payments = await Payment.find(filter)
      .populate('member', 'name flatNumber wing phone')
      .populate('maintenance', 'month year amount dueDate')
      .populate('recordedBy', 'name role')
      .sort({ year: -1, month: -1, flatNumber: 1 });
    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my-status', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ member: req.user._id })
      .populate('maintenance', 'month year amount dueDate lateFee description extraCharges')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/summary/:maintenanceId', protect, committee(), async (req, res) => {
  try {
    const payments = await Payment.find({ maintenance: req.params.maintenanceId })
      .populate('member', 'name flatNumber wing phone')
      .sort({ flatNumber: 1 });
    const paid = payments.filter(p => p.status === 'paid');
    const pending = payments.filter(p => p.status === 'pending');
    const overdue = payments.filter(p => p.status === 'overdue');
    const totalCollected = paid.reduce((sum, p) => sum + p.totalAmount, 0);
    res.json({ success: true, summary: { total: payments.length, paid: paid.length, pending: pending.length, overdue: overdue.length, totalCollected }, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/record', protect, committee(), async (req, res) => {
  try {
    const { paymentId, paymentMethod, transactionId, remarks, lateFee } = req.body;
    const payment = await Payment.findById(paymentId).populate('maintenance');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });
    if (payment.status === 'paid') return res.status(400).json({ success: false, message: 'Payment already recorded as paid' });
    const lf = lateFee || 0;
    payment.status = 'paid';
    payment.paymentDate = new Date();
    payment.paymentMethod = paymentMethod || 'cash';
    payment.transactionId = transactionId;
    payment.remarks = remarks;
    payment.lateFee = lf;
    payment.amountPaid = payment.maintenance.amount;
    payment.totalAmount = payment.maintenance.amount + lf;
    payment.recordedBy = req.user._id;
    await payment.save();
    res.json({ success: true, payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/mark-overdue', protect, committee(), async (req, res) => {
  try {
    const now = new Date();
    const overdueMaintenance = await Maintenance.find({ dueDate: { $lt: now } });
    const maintenanceIds = overdueMaintenance.map(m => m._id);
    const result = await Payment.updateMany(
      { maintenance: { $in: maintenanceIds }, status: 'pending' },
      { status: 'overdue' }
    );
    res.json({ success: true, message: `${result.modifiedCount} payments marked as overdue` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/dues/list', protect, committee(), async (req, res) => {
  try {
    const filter = { status: { $in: ['pending', 'overdue'] } };
    if (req.query.flatNumber) filter.flatNumber = req.query.flatNumber;
    const payments = await Payment.find(filter)
      .populate('member', 'name flatNumber wing phone')
      .populate('maintenance', 'month year amount dueDate lateFee')
      .sort({ year: 1, month: 1 });
    const totalDues = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    res.json({ success: true, count: payments.length, totalDues, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;