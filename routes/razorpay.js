const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// Create order
router.post('/create-order', protect, async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId).populate('maintenance');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const order = await razorpay.orders.create({
      amount: payment.totalAmount * 100,
      currency: 'INR',
      receipt: `receipt_${paymentId}`,
      notes: {
        paymentId: paymentId,
        flatNumber: payment.flatNumber
      }
    });

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify payment
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const payment = await Payment.findById(paymentId).populate('maintenance');
    payment.status = 'paid';
    payment.paymentDate = new Date();
    payment.paymentMethod = 'online';
    payment.transactionId = razorpay_payment_id;
    payment.amountPaid = payment.maintenance.amount;
    payment.recordedBy = req.user._id;
    await payment.save();

    res.json({ success: true, message: 'Payment verified and recorded!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;