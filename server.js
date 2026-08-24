const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const songRoutes = require('./routes/songs');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.send('Music API backend is running!');
});

app.use('/api/songs', songRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});