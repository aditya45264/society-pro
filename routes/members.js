const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, committee } = require('../middleware/auth');

router.get('/', protect, committee(), async (req, res) => {
  try {
    const members = await User.find().sort({ flatNumber: 1 });
    res.json({ success: true, count: members.length, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/all-flats', protect, async (req, res) => {
  try {
    const members = await User.find({ isActive: true }, 'name flatNumber wing').sort({ flatNumber: 1 });
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, committee(), async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, committee(), async (req, res) => {
  try {
    const { name, email, role, flatNumber, phone, wing, floor, isActive } = req.body;
    const member = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, flatNumber, phone, wing, floor, isActive },
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, committee('chairman'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Member deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;