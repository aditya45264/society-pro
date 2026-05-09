const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes FIRST
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Static files AFTER
app.use(express.static(path.join(__dirname)));

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
mongoose.connect('mongodb://aditya45:Aditya45_@ac-g6oe0xk-shard-00-00.sm9gzpk.mongodb.net:27017,ac-g6oe0xk-shard-00-01.sm9gzpk.mongodb.net:27017,ac-g6oe0xk-shard-00-02.sm9gzpk.mongodb.net:27017/society_maintenance?ssl=true&replicaSet=atlas-c1lw2h-shard-0&authSource=admin&appName=Cluster0')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    const PORT = 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;