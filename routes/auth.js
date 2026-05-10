
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
delete require.cache[require.resolve('../models/User')];
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, 'society_secret_key_change_this', { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, flatNumber, phone, wing, floor } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Check if committee role is already taken
    const committeeRoles = ['secretary', 'treasurer', 'chairman'];
    if (committeeRoles.includes(role)) {
      const roleExists = await User.findOne({ role, isActive: true });
      if (roleExists) {
        return res.status(400).json({ success: false, message: `A ${role} is already registered. Only one ${role} is allowed.` });
      }
    }

    const user = await User.create({ name, email, password, role: role || 'member', flatNumber, phone, wing, floor });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, flatNumber: user.flatNumber } });
  } catch (err) {
    console.log('Register error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, flatNumber: user.flatNumber, phone: user.phone, wing: user.wing } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, wing, floor } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, wing, floor }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;