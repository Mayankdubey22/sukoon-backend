const User = require('../models/user.model');

/*
=========================================================
GET USER LIBRARY
=========================================================
*/
const getLibrary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'likedSongs playlists likedPlaylists'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      library: {
        likedSongs: user.likedSongs || [],
        playlists: user.playlists || [],
        likedPlaylists: user.likedPlaylists || [],
      },
    });
  } catch (error) {
    console.error(
      'Get library error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch library.',
    });
  }
};


/*
=========================================================
LIKE SONG
=========================================================
*/
const likeSong = async (req, res) => {
  try {
    const { song } = req.body;

    if (!song || !song.id) {
      return res.status(400).json({
        success: false,
        message: 'Valid song data is required.',
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const alreadyLiked =
      user.likedSongs.some(
        (item) =>
          String(item?.id) ===
          String(song.id)
      );

    if (alreadyLiked) {
      return res.status(409).json({
        success: false,
        message: 'Song is already liked.',
      });
    }

    user.likedSongs.push(song);

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Song added to liked songs.',
      song,
    });
  } catch (error) {
    console.error(
      'Like song error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to like song.',
    });
  }
};


/*
=========================================================
UNLIKE SONG
=========================================================
*/
const unlikeSong = async (req, res) => {
  try {
    const { songId } = req.params;

    if (!songId) {
      return res.status(400).json({
        success: false,
        message: 'Song ID is required.',
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const originalLength =
      user.likedSongs.length;

    user.likedSongs =
      user.likedSongs.filter(
        (song) =>
          String(song?.id) !==
          String(songId)
      );

    if (
      user.likedSongs.length ===
      originalLength
    ) {
      return res.status(404).json({
        success: false,
        message: 'Liked song not found.',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'Song removed from liked songs.',
    });
  } catch (error) {
    console.error(
      'Unlike song error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to unlike song.',
    });
  }
};


/*
=========================================================
CREATE PLAYLIST
=========================================================
*/
const createPlaylist = async (req, res) => {
  try {
    const {
      name,
      songToAdd = null,
    } = req.body;

    const cleanName =
      name?.trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message:
          'Playlist name is required.',
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const newPlaylist = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      name: cleanName,

      songs:
        songToAdd?.id
          ? [songToAdd]
          : [],

      createdAt: new Date(),
    };

    user.playlists.push(
      newPlaylist
    );

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Playlist created.',
      playlist: newPlaylist,
    });
  } catch (error) {
    console.error(
      'Create playlist error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to create playlist.',
    });
  }
};


/*
=========================================================
DELETE PLAYLIST
=========================================================
*/
const deletePlaylist = async (
  req,
  res
) => {
  try {
    const { playlistId } =
      req.params;

    if (!playlistId) {
      return res.status(400).json({
        success: false,
        message:
          'Playlist ID is required.',
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const originalLength =
      user.playlists.length;

    user.playlists =
      user.playlists.filter(
        (playlist) =>
          String(playlist.id) !==
          String(playlistId)
      );

    if (
      user.playlists.length ===
      originalLength
    ) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found.',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Playlist deleted.',
    });
  } catch (error) {
    console.error(
      'Delete playlist error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to delete playlist.',
    });
  }
};


/*
=========================================================
ADD SONG TO PLAYLIST
=========================================================
*/
const addToPlaylist = async (
  req,
  res
) => {
  try {
    const { playlistId } =
      req.params;

    const { song } = req.body;

    if (!playlistId || !song?.id) {
      return res.status(400).json({
        success: false,
        message:
          'Playlist ID and song are required.',
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const playlist =
      user.playlists.find(
        (item) =>
          String(item.id) ===
          String(playlistId)
      );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found.',
      });
    }

    const alreadyExists =
      playlist.songs.some(
        (item) =>
          String(item?.id) ===
          String(song.id)
      );

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message:
          'Song already exists in this playlist.',
      });
    }

    playlist.songs.push(song);

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'Song added to playlist.',
      playlist,
    });
  } catch (error) {
    console.error(
      'Add to playlist error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to add song to playlist.',
    });
  }
};


/*
=========================================================
REMOVE SONG FROM PLAYLIST
=========================================================
*/
const removeFromPlaylist = async (
  req,
  res
) => {
  try {
    const {
      playlistId,
      songId,
    } = req.params;

    if (!playlistId || !songId) {
      return res.status(400).json({
        success: false,
        message:
          'Playlist ID and song ID are required.',
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const playlist =
      user.playlists.find(
        (item) =>
          String(item.id) ===
          String(playlistId)
      );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found.',
      });
    }

    const originalLength =
      playlist.songs.length;

    playlist.songs =
      playlist.songs.filter(
        (song) =>
          String(song?.id) !==
          String(songId)
      );

    if (
      playlist.songs.length ===
      originalLength
    ) {
      return res.status(404).json({
        success: false,
        message:
          'Song not found in playlist.',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'Song removed from playlist.',
      playlist,
    });
  } catch (error) {
    console.error(
      'Remove from playlist error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to remove song from playlist.',
    });
  }
};


/*
=========================================================
LIKE READY-MADE PLAYLIST
=========================================================
*/
const likePlaylist = async (
  req,
  res
) => {
  try {
    const { playlist } =
      req.body;

    if (!playlist?.id) {
      return res.status(400).json({
        success: false,
        message:
          'Valid playlist data is required.',
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const alreadyLiked =
      user.likedPlaylists.some(
        (item) =>
          String(item?.id) ===
          String(playlist.id)
      );

    if (alreadyLiked) {
      return res.status(409).json({
        success: false,
        message:
          'Playlist is already liked.',
      });
    }

    user.likedPlaylists.push({
      id: playlist.id,
      name:
        playlist.name ||
        'Untitled Playlist',
      image:
        playlist.image ||
        null,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message:
        'Playlist added to liked playlists.',
    });
  } catch (error) {
    console.error(
      'Like playlist error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to like playlist.',
    });
  }
};


/*
=========================================================
UNLIKE READY-MADE PLAYLIST
=========================================================
*/
const unlikePlaylist = async (
  req,
  res
) => {
  try {
    const { playlistId } =
      req.params;

    if (!playlistId) {
      return res.status(400).json({
        success: false,
        message:
          'Playlist ID is required.',
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const originalLength =
      user.likedPlaylists.length;

    user.likedPlaylists =
      user.likedPlaylists.filter(
        (playlist) =>
          String(playlist?.id) !==
          String(playlistId)
      );

    if (
      user.likedPlaylists.length ===
      originalLength
    ) {
      return res.status(404).json({
        success: false,
        message:
          'Liked playlist not found.',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'Playlist removed from liked playlists.',
    });
  } catch (error) {
    console.error(
      'Unlike playlist error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to unlike playlist.',
    });
  }
};


module.exports = {
  getLibrary,

  likeSong,
  unlikeSong,

  createPlaylist,
  deletePlaylist,

  addToPlaylist,
  removeFromPlaylist,

  likePlaylist,
  unlikePlaylist,
};