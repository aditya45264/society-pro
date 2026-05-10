const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['member', 'secretary', 'treasurer', 'chairman'], default: 'member' },
  customRole: { type: String, trim: true, default: '' },
  flatNumber: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  wing: { type: String, trim: true },
  floor: { type: Number },
  isActive: { type: Boolean, default: true },
  joinedDate: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  bcrypt.hash(this.password, 12).then(hash => {
    this.password = hash;
    next();
  }).catch(next);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  // Handle plain text passwords (old accounts)
  if (!this.password.startsWith('$2')) {
    return candidatePassword === this.password;
  }
  // Handle bcrypt hashed passwords (new accounts)
  return await bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('User', userSchema);