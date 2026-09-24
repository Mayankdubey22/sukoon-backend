const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const songRoutes = require('./routes/songs');
const lyricsRoutes = require('./routes/lyrics');

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

// Song routes
app.use('/api/songs', songRoutes);

// Lyrics routes
app.use('/api/lyrics', lyricsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'sukoon-backend',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});