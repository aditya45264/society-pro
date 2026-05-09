const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['member', 'secretary', 'treasurer', 'chairman'], default: 'member' },
  flatNumber: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  wing: { type: String, trim: true },
  floor: { type: Number },
  isActive: { type: Boolean, default: true },
  joinedDate: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return candidatePassword === this.password;
};

module.exports = mongoose.model('User', userSchema);
