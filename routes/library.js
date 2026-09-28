const express = require('express');

const {
  getLibrary,

  likeSong,
  unlikeSong,

  createPlaylist,
  deletePlaylist,

  addToPlaylist,
  removeFromPlaylist,

  likePlaylist,
  unlikePlaylist,
} = require('../controllers/library.controller');

const {
  protect,
} = require('../middleware/auth.middleware');

const router = express.Router();

/*
=========================================================
GET COMPLETE USER LIBRARY
=========================================================
*/

router.get(
  '/',
  protect,
  getLibrary
);


/*
=========================================================
LIKED SONGS
=========================================================
*/

router.post(
  '/likes',
  protect,
  likeSong
);

router.delete(
  '/likes/:songId',
  protect,
  unlikeSong
);


/*
=========================================================
CUSTOM PLAYLISTS
=========================================================
*/

router.post(
  '/playlists',
  protect,
  createPlaylist
);

router.delete(
  '/playlists/:playlistId',
  protect,
  deletePlaylist
);

router.post(
  '/playlists/:playlistId/songs',
  protect,
  addToPlaylist
);

router.delete(
  '/playlists/:playlistId/songs/:songId',
  protect,
  removeFromPlaylist
);


/*
=========================================================
LIKED READY-MADE PLAYLISTS
=========================================================
*/

router.post(
  '/liked-playlists',
  protect,
  likePlaylist
);

router.delete(
  '/liked-playlists/:playlistId',
  protect,
  unlikePlaylist
);

module.exports = router;