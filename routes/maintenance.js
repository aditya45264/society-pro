const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect, committee } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const schedules = await Maintenance.find()
      .sort({ year: -1, month: -1 })
      .populate('issuedBy', 'name role');
    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/current', protect, async (req, res) => {
  try {
    const now = new Date();
    const schedule = await Maintenance.findOne({ month: now.getMonth() + 1, year: now.getFullYear() })
      .populate('issuedBy', 'name role');
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const schedule = await Maintenance.findById(req.params.id).populate('issuedBy', 'name role');
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, committee(), async (req, res) => {
  try {
    const { month, year, amount, dueDate, lateFee, description, extraCharges } = req.body;
    const existing = await Maintenance.findOne({ month, year });
    if (existing) return res.status(400).json({ success: false, message: `Maintenance for ${month}/${year} already issued` });
    const schedule = await Maintenance.create({
      month, year, amount, dueDate, lateFee, description, extraCharges,
      issuedBy: req.user._id
    });
    const members = await User.find({ isActive: true });
    const paymentDocs = members.map(m => ({
      member: m._id,
      maintenance: schedule._id,
      flatNumber: m.flatNumber,
      amountPaid: 0,
      lateFee: 0,
      totalAmount: amount,
      status: 'pending',
      month,
      year
    }));
    await Payment.insertMany(paymentDocs, { ordered: false });
    res.status(201).json({ success: true, schedule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, committee(), async (req, res) => {
  try {
    const schedule = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, committee('chairman'), async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    await Payment.deleteMany({ maintenance: req.params.id });
    res.json({ success: true, message: 'Maintenance schedule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;