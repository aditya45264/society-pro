const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) {
    const key = line.substring(0, eqIndex).trim();
    const val = line.substring(eqIndex + 1).trim();
    process.env[key] = val;
  }
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const MONGODB_URI = 'mongodb://aditya45:Aditya45_@ac-g6oe0xk-shard-00-00.sm9gzpk.mongodb.net:27017,ac-g6oe0xk-shard-00-01.sm9gzpk.mongodb.net:27017,ac-g6oe0xk-shard-00-02.sm9gzpk.mongodb.net:27017/society_maintenance?ssl=true&replicaSet=atlas-c1lw2h-shard-0&authSource=admin&appName=Cluster0';
const JWT_SECRET = 'society_secret_key_change_this';
const PORT = 5000;
console.log('Razorpay Key:', process.env.RAZORPAY_KEY_ID);
console.log('Razorpay Secret:', process.env.RAZORPAY_KEY_SECRET ? 'found' : 'undefined');
console.log('Razorpay Key:', process.env.RAZORPAY_KEY_ID);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/razorpay', require('./routes/razorpay'));
app.use('/js', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/js', express.static(path.join(__dirname, 'js')));

app.use('/css', express.static(path.join(__dirname, 'css')));


app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

mongoose.connect('mongodb://aditya45:Aditya45_@ac-g6oe0xk-shard-00-00.sm9gzpk.mongodb.net:27017,ac-g6oe0xk-shard-00-01.sm9gzpk.mongodb.net:27017,ac-g6oe0xk-shard-00-02.sm9gzpk.mongodb.net:27017/society_maintenance?ssl=true&replicaSet=atlas-c1lw2h-shard-0&authSource=admin&appName=Cluster0')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;