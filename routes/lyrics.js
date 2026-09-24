const express = require('express');

const {
  getSongLyrics,
} = require('../controllers/lyrics.controller');

const router = express.Router();

// Get lyrics for a song
// GET /api/lyrics/:id
router.get('/:id', getSongLyrics);

module.exports = router;