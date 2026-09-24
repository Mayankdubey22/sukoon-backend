const {
  getLyrics,
} = require('../services/lyrics.service');

// ---------------------------------------------------------
// GET LYRICS FOR A SONG
// ---------------------------------------------------------

const getSongLyrics = async (req, res) => {
  try {
    const {
      id,
    } = req.params;

    const {
      name,
      artist,
      album,
      duration,
    } = req.query;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Song ID is required',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Song name is required',
      });
    }

    // -----------------------------------------------------
    // CONVERT DURATION
    // -----------------------------------------------------

    const parsedDuration =
      duration !== undefined
        ? Number(duration)
        : 0;

    const safeDuration =
      Number.isFinite(parsedDuration) &&
      parsedDuration > 0
        ? parsedDuration
        : 0;

    // -----------------------------------------------------
    // GET LYRICS
    // -----------------------------------------------------

    const result = await getLyrics({
      songId: id,
      songName: name,
      artistName: artist || '',
      albumName: album || '',
      duration: safeDuration,
    });

    // -----------------------------------------------------
    // LYRICS NOT AVAILABLE
    // -----------------------------------------------------

    if (!result.available) {
      return res.status(200).json({
        success: true,
        available: false,
        cached: false,
        synced: false,
        source: null,
        data: null,
        message:
          result.message ||
          'Lyrics are not available for this song.',
      });
    }

    // -----------------------------------------------------
    // SUCCESS
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,
      available: true,
      cached: result.cached,
      synced: result.synced,
      source: result.source,
      data: result.data,
    });
  } catch (error) {
    console.error(
      'Lyrics controller error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      available: false,
      message:
        error.message ||
        'Failed to fetch lyrics',
    });
  }
};

module.exports = {
  getSongLyrics,
};