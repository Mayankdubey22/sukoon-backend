const mongoose = require('mongoose');

const syncedLyricSchema = new mongoose.Schema(
  {
    time: {
      type: Number,
      required: true,
      min: 0,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const lyricsSchema = new mongoose.Schema(
  {
    // JioSaavn song ID
    songId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    songName: {
      type: String,
      required: true,
      trim: true,
    },

    artistName: {
      type: String,
      default: '',
      trim: true,
    },

    // Normal unsynchronized lyrics
    lyrics: {
      type: String,
      default: '',
    },

    // Timestamped lyrics for synchronization
    syncedLyrics: {
      type: [syncedLyricSchema],
      default: [],
    },

    // Whether timestamped lyrics are available
    isSynced: {
      type: Boolean,
      default: false,
    },

    // Where the lyrics came from
    source: {
      type: String,
      enum: [
        'lyrics-api',
        'ai',
        'manual',
        'unknown',
      ],
      default: 'unknown',
    },

    /*
     * 30-day inactive cache system.
     *
     * Every time lyrics are requested,
     * this date will be updated.
     *
     * MongoDB TTL will automatically delete
     * the document 30 days after this date.
     */
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Delete lyrics automatically after 30 days
 * from lastAccessedAt.
 *
 * 30 days = 30 * 24 * 60 * 60 seconds
 */
lyricsSchema.index(
  {
    lastAccessedAt: 1,
  },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
  }
);

const Lyrics = mongoose.model(
  'Lyrics',
  lyricsSchema
);

module.exports = Lyrics;