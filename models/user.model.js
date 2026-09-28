const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    profileImage: {
      type: String,
      default: '',
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // USER LIBRARY
    // =====================================================

    likedSongs: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    playlists: {
      type: [
        {
          id: {
            type: String,
            required: true,
          },

          name: {
            type: String,
            required: true,
            trim: true,
          },

          songs: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
          },

          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },

    likedPlaylists: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model(
  'User',
  userSchema
);

module.exports = User;