const mongoose = require('mongoose');

const likedSongSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    songId: {
      type: String,
      required: true,
    },

    songData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// A user can like a song only once.
likedSongSchema.index(
  { user: 1, songId: 1 },
  { unique: true }
);

const LikedSong = mongoose.model(
  'LikedSong',
  likedSongSchema
);

module.exports = LikedSong;