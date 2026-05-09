const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Notice = require('../models/Notice');
const { protect, committee } = require('../middleware/auth');

router.get('/stats', protect, committee(), async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [totalMembers, currentMaintenance, allPaymentsThisMonth, notices] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Maintenance.findOne({ month: currentMonth, year: currentYear }),
      Payment.find({ month: currentMonth, year: currentYear }),
      Notice.countDocuments({ isActive: true })
    ]);

    const paid = allPaymentsThisMonth.filter(p => p.status === 'paid').length;
    const pending = allPaymentsThisMonth.filter(p => p.status === 'pending').length;
    const overdue = allPaymentsThisMonth.filter(p => p.status === 'overdue').length;
    const totalCollected = allPaymentsThisMonth.filter(p => p.status === 'paid').reduce((s, p) => s + p.totalAmount, 0);
    const totalDues = allPaymentsThisMonth.filter(p => p.status !== 'paid').reduce((s, p) => s + p.totalAmount, 0);

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthPayments = await Payment.find({ month: m, year: y, status: 'paid' });
      const collected = monthPayments.reduce((s, p) => s + p.totalAmount, 0);
      trend.push({ month: m, year: y, collected });
    }

    res.json({
      success: true,
      stats: { totalMembers, currentMonthAmount: currentMaintenance?.amount || 0, paid, pending, overdue, totalCollected, totalDues, notices, trend }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/member-stats', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ member: req.user._id })
      .populate('maintenance', 'month year amount dueDate');
    const paid = payments.filter(p => p.status === 'paid').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.totalAmount, 0);
    const totalDues = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.totalAmount, 0);
    res.json({ success: true, stats: { paid, pending, overdue, totalPaid, totalDues, recentPayments: payments.slice(0, 5) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;