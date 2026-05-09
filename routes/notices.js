const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect, committee } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true })
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, notices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, committee(), async (req, res) => {
  try {
    const { title, content, category, expiryDate } = req.body;
    const notice = await Notice.create({ title, content, category, expiryDate, postedBy: req.user._id });
    res.status(201).json({ success: true, notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, committee(), async (req, res) => {
  try {
    await Notice.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Notice removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;