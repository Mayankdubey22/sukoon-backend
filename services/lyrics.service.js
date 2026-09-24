const axios = require('axios');

const Lyrics = require('../models/lyrics.model');

const LRCLIB_URL = 'https://lrclib.net/api/get';

const LRCLIB_HEADERS = {
  'User-Agent':
    'Sukoon-Music-App/1.0 (Personal Project)',
};

// ---------------------------------------------------------
// CACHE VERSION
// ---------------------------------------------------------

const CACHE_REFRESH_AFTER = new Date(
  '2026-09-23T00:00:00.000Z'
);

// ---------------------------------------------------------
// SONG SYNC CALIBRATION
//
// IMPORTANT:
// These are temporary per-song corrections.
//
// Positive value:
// Lyrics need to move FORWARD in the song.
//
// Example:
// LRCLIB says lyric starts at 10s
// syncOffset = +7
// Sukoon uses 17s
//
// Negative value:
// Lyrics need to move BACKWARD.
//
// We will eventually move these values into MongoDB.
// ---------------------------------------------------------

const SYNC_OFFSETS = {
  'ride it|jay sean': 7,
};

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

const cleanText = (value = '') => {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
};

// ---------------------------------------------------------
// NORMALIZE TEXT
// ---------------------------------------------------------

const normalizeForComparison = (value = '') => {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// ---------------------------------------------------------
// GET SONG SYNC OFFSET
// ---------------------------------------------------------

const getSyncOffset = ({
  songName = '',
  artistName = '',
}) => {
  const song = normalizeForComparison(songName);
  const artist = normalizeForComparison(artistName);

  if (!song) {
    return 0;
  }

  const exactKey = `${song}|${artist}`;

  if (
    Object.prototype.hasOwnProperty.call(
      SYNC_OFFSETS,
      exactKey
    )
  ) {
    return Number(SYNC_OFFSETS[exactKey]) || 0;
  }

  return 0;
};

// ---------------------------------------------------------
// APPLY SYNC OFFSET
// ---------------------------------------------------------

const applySyncOffset = (
  syncedLyrics = [],
  syncOffset = 0
) => {
  if (
    !Array.isArray(syncedLyrics) ||
    syncedLyrics.length === 0
  ) {
    return [];
  }

  const safeOffset =
    Number.isFinite(Number(syncOffset))
      ? Number(syncOffset)
      : 0;

  return syncedLyrics
    .map((line) => ({
      ...line,
      time: Math.max(
        0,
        Number(line.time) + safeOffset
      ),
    }))
    .filter(
      (line) =>
        Number.isFinite(line.time) &&
        typeof line.text === 'string' &&
        line.text.trim().length > 0
    )
    .sort((a, b) => a.time - b.time);
};

// ---------------------------------------------------------
// CREATE WORD SET
// ---------------------------------------------------------

const getWordSet = (value = '') => {
  const normalized =
    normalizeForComparison(value);

  if (!normalized) {
    return new Set();
  }

  return new Set(
    normalized
      .split(' ')
      .filter(Boolean)
  );
};

// ---------------------------------------------------------
// CHECK TEXT SIMILARITY
// ---------------------------------------------------------

const isTextMatch = (
  requestedValue,
  providerValue,
  {
    allowPartial = true,
  } = {}
) => {
  const requested =
    normalizeForComparison(
      requestedValue
    );

  const provider =
    normalizeForComparison(
      providerValue
    );

  if (!provider) {
    return true;
  }

  if (!requested) {
    return true;
  }

  if (requested === provider) {
    return true;
  }

  if (
    allowPartial &&
    (
      requested.includes(provider) ||
      provider.includes(requested)
    )
  ) {
    return true;
  }

  const requestedWords =
    getWordSet(requested);

  const providerWords =
    getWordSet(provider);

  if (
    requestedWords.size === 0 ||
    providerWords.size === 0
  ) {
    return false;
  }

  let matchingWords = 0;

  for (const word of requestedWords) {
    if (providerWords.has(word)) {
      matchingWords += 1;
    }
  }

  const smallerSize = Math.min(
    requestedWords.size,
    providerWords.size
  );

  return (
    smallerSize > 0 &&
    matchingWords / smallerSize >= 0.75
  );
};

// ---------------------------------------------------------
// CHECK ARTIST MATCH
// ---------------------------------------------------------

const isArtistMatch = (
  requestedArtist,
  providerArtist
) => {
  if (!providerArtist) {
    return true;
  }

  const requested =
    normalizeForComparison(
      requestedArtist
    );

  const provider =
    normalizeForComparison(
      providerArtist
    );

  if (!requested || !provider) {
    return true;
  }

  if (requested === provider) {
    return true;
  }

  if (
    requested.includes(provider) ||
    provider.includes(requested)
  ) {
    return true;
  }

  const requestedWords =
    getWordSet(requested);

  const providerWords =
    getWordSet(provider);

  let matchingWords = 0;

  for (const word of requestedWords) {
    if (providerWords.has(word)) {
      matchingWords += 1;
    }
  }

  return (
    requestedWords.size > 0 &&
    matchingWords /
      requestedWords.size >=
      0.7
  );
};

// ---------------------------------------------------------
// PARSE LRC TIMESTAMPS
// ---------------------------------------------------------

const parseSyncedLyrics = (
  syncedLyrics = ''
) => {
  if (
    !syncedLyrics ||
    typeof syncedLyrics !== 'string'
  ) {
    return [];
  }

  const lines =
    syncedLyrics.split(/\r?\n/);

  const parsed = [];

  let offsetMs = 0;

  // -------------------------------------------------------
  // FIRST PASS
  // Find LRC offset
  // -------------------------------------------------------

  for (const line of lines) {
    const offsetMatch =
      line.match(
        /^\s*\[offset\s*:\s*(-?\d+)\s*\]\s*$/i
      );

    if (!offsetMatch) {
      continue;
    }

    const value =
      Number(offsetMatch[1]);

    if (Number.isFinite(value)) {
      offsetMs = value;
    }
  }

  // -------------------------------------------------------
  // SECOND PASS
  // Parse timestamps
  // -------------------------------------------------------

  for (const rawLine of lines) {
    let line = rawLine.trim();

    if (!line) {
      continue;
    }

    // Metadata tags
    if (
      /^\[(ar|ti|al|by|re|ve|length|offset):/i.test(
        line
      )
    ) {
      continue;
    }

    const timestamps = [];

    const timestampRegex =
      /^\[(\d{1,3}):(\d{2}(?:[.,]\d{1,3})?)\]/;

    // -----------------------------------------------------
    // Read every timestamp at the beginning
    // -----------------------------------------------------

    while (true) {
      const match =
        line.match(timestampRegex);

      if (!match) {
        break;
      }

      const minutes =
        Number(match[1]);

      const seconds =
        Number(
          match[2].replace(',', '.')
        );

      if (
        Number.isFinite(minutes) &&
        Number.isFinite(seconds) &&
        seconds >= 0 &&
        seconds < 60
      ) {
        const rawTime =
          minutes * 60 + seconds;

        const adjustedTime =
          rawTime +
          offsetMs / 1000;

        timestamps.push(
          Math.max(0, adjustedTime)
        );
      }

      line =
        line.slice(match[0].length);
    }

    if (timestamps.length === 0) {
      continue;
    }

    const text =
      line.trim();

    if (!text) {
      continue;
    }

    for (const time of timestamps) {
      if (!Number.isFinite(time)) {
        continue;
      }

      parsed.push({
        time,
        text,
      });
    }
  }

  // -------------------------------------------------------
  // SORT
  // -------------------------------------------------------

  parsed.sort(
    (a, b) => a.time - b.time
  );

  // -------------------------------------------------------
  // REMOVE DUPLICATES
  // -------------------------------------------------------

  const cleaned = [];

  for (const line of parsed) {
    const previous =
      cleaned[cleaned.length - 1];

    if (
      previous &&
      previous.time === line.time &&
      previous.text === line.text
    ) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned;
};

// ---------------------------------------------------------
// VALIDATE SYNCED LYRICS
// ---------------------------------------------------------

const validateSyncedLyrics = ({
  syncedLyrics,
  requestedDuration = 0,
  providerDuration = 0,
}) => {
  if (
    !Array.isArray(syncedLyrics) ||
    syncedLyrics.length === 0
  ) {
    return false;
  }

  const validLines =
    syncedLyrics.filter(
      (line) =>
        Number.isFinite(line?.time) &&
        line.time >= 0 &&
        typeof line?.text === 'string' &&
        line.text.trim().length > 0
    );

  if (validLines.length === 0) {
    return false;
  }

  // -------------------------------------------------------
  // PROVIDER DURATION CHECK
  // -------------------------------------------------------

  if (
    Number.isFinite(requestedDuration) &&
    requestedDuration > 0 &&
    Number.isFinite(providerDuration) &&
    providerDuration > 0
  ) {
    const difference =
      Math.abs(
        requestedDuration -
          providerDuration
      );

    const tolerance = 5;

    if (difference > tolerance) {
      console.warn(
        `Lyrics duration mismatch: requested=${requestedDuration}s provider=${providerDuration}s`
      );

      return false;
    }
  }

  // -------------------------------------------------------
  // LAST TIMESTAMP CHECK
  // -------------------------------------------------------

  if (
    Number.isFinite(requestedDuration) &&
    requestedDuration > 0
  ) {
    const lastTimestamp =
      validLines[
        validLines.length - 1
      ].time;

    const maximumAllowed =
      requestedDuration + 10;

    if (
      lastTimestamp >
      maximumAllowed
    ) {
      console.warn(
        `Lyrics timestamp exceeds song duration: last=${lastTimestamp}s duration=${requestedDuration}s`
      );

      return false;
    }
  }

  return true;
};

// ---------------------------------------------------------
// CHECK LRCLIB RESULT MATCH
// ---------------------------------------------------------

const validateProviderMatch = ({
  lyricsData,
  songName,
  artistName,
  albumName,
  duration,
}) => {
  if (!lyricsData) {
    return false;
  }

  // -------------------------------------------------------
  // TRACK NAME
  // -------------------------------------------------------

  const trackMatches =
    isTextMatch(
      songName,
      lyricsData.trackName,
      {
        allowPartial: true,
      }
    );

  if (!trackMatches) {
    console.warn(
      `LRCLIB track mismatch: requested="${songName}" provider="${lyricsData.trackName}"`
    );

    return false;
  }

  // -------------------------------------------------------
  // ARTIST
  // -------------------------------------------------------

  const artistMatches =
    isArtistMatch(
      artistName,
      lyricsData.artistName
    );

  if (!artistMatches) {
    console.warn(
      `LRCLIB artist mismatch: requested="${artistName}" provider="${lyricsData.artistName}"`
    );

    return false;
  }

  // -------------------------------------------------------
  // ALBUM
  // -------------------------------------------------------

  if (
    albumName &&
    lyricsData.albumName
  ) {
    const albumMatches =
      isTextMatch(
        albumName,
        lyricsData.albumName,
        {
          allowPartial: true,
        }
      );

    if (!albumMatches) {
      console.warn(
        `LRCLIB album mismatch: requested="${albumName}" provider="${lyricsData.albumName}"`
      );

      return false;
    }
  }

  // -------------------------------------------------------
  // DURATION
  // -------------------------------------------------------

  const providerDuration =
    Number(
      lyricsData.duration
    );

  if (
    Number.isFinite(duration) &&
    duration > 0 &&
    Number.isFinite(providerDuration) &&
    providerDuration > 0
  ) {
    const difference =
      Math.abs(
        duration -
          providerDuration
      );

    const tolerance = 5;

    if (
      difference > tolerance
    ) {
      console.warn(
        `LRCLIB recording duration mismatch: requested=${duration}s provider=${providerDuration}s`
      );

      return false;
    }
  }

  return true;
};

// ---------------------------------------------------------
// CHECK CACHE
// ---------------------------------------------------------

const isCachedSyncUsable = ({
  cachedLyrics,
  duration = 0,
}) => {
  if (!cachedLyrics) {
    return false;
  }

  // -------------------------------------------------------
  // FORCE REFRESH OLD CACHE
  // -------------------------------------------------------

  if (
    cachedLyrics.updatedAt &&
    new Date(
      cachedLyrics.updatedAt
    ) < CACHE_REFRESH_AFTER
  ) {
    console.log(
      `Refreshing old lyrics cache for ${cachedLyrics.songId}`
    );

    return false;
  }

  if (!cachedLyrics.isSynced) {
    return true;
  }

  const syncedLyrics =
    Array.isArray(
      cachedLyrics.syncedLyrics
    )
      ? cachedLyrics.syncedLyrics
      : [];

  if (
    syncedLyrics.length === 0
  ) {
    return false;
  }

  if (
    duration > 30 &&
    syncedLyrics.length < 2
  ) {
    return false;
  }

  return validateSyncedLyrics({
    syncedLyrics,
    requestedDuration:
      duration,
    providerDuration: 0,
  });
};

// ---------------------------------------------------------
// FIND LYRICS IN MONGODB
// ---------------------------------------------------------

const getCachedLyrics = async (
  songId
) => {
  if (!songId) {
    return null;
  }

  const cachedLyrics =
    await Lyrics.findOneAndUpdate(
      {
        songId: String(songId),
      },
      {
        $set: {
          lastAccessedAt:
            new Date(),
        },
      },
      {
        returnDocument: 'after',
      }
    ).lean();

  return cachedLyrics;
};

// ---------------------------------------------------------
// FETCH LYRICS FROM LRCLIB
// ---------------------------------------------------------

const fetchFromLrcLib = async ({
  trackName,
  artistName,
  albumName,
  duration,
}) => {
  const params = {
    track_name: trackName,
    artist_name: artistName,
  };

  if (albumName) {
    params.album_name =
      albumName;
  }

  if (
    Number.isFinite(duration) &&
    duration > 0
  ) {
    params.duration =
      duration;
  }

  const response =
    await axios.get(
      LRCLIB_URL,
      {
        params,
        headers:
          LRCLIB_HEADERS,
        timeout: 8000,
      }
    );

  return response.data;
};

// ---------------------------------------------------------
// GET LYRICS
// ---------------------------------------------------------

const getLyrics = async ({
  songId,
  songName,
  artistName,
  albumName = '',
  duration = 0,
}) => {
  if (!songId) {
    throw new Error(
      'Song ID is required'
    );
  }

  if (!songName) {
    throw new Error(
      'Song name is required'
    );
  }

  // -------------------------------------------------------
  // GET SONG-SPECIFIC SYNC OFFSET
  // -------------------------------------------------------

  const syncOffset =
    getSyncOffset({
      songName,
      artistName,
    });

  // -------------------------------------------------------
  // 1. CHECK CACHE
  // -------------------------------------------------------

  const cachedLyrics =
    await getCachedLyrics(
      songId
    );

  if (cachedLyrics) {
    const cacheUsable =
      isCachedSyncUsable({
        cachedLyrics,
        duration,
      });

    if (cacheUsable) {
      return {
        available: true,
        cached: true,
        synced:
          cachedLyrics.isSynced,
        source:
          cachedLyrics.source,
        syncOffset,
        data: {
          ...cachedLyrics,
          syncOffset,
        },
      };
    }

    console.log(
      `Cached lyrics rejected for song ${songId}. Fetching fresh lyrics.`
    );
  }

  // -------------------------------------------------------
  // 2. FETCH FROM LRCLIB
  // -------------------------------------------------------

  let lyricsData;

  try {
    lyricsData =
      await fetchFromLrcLib({
        trackName:
          songName,
        artistName,
        albumName,
        duration,
      });
  } catch (error) {
    if (
      error.response?.status ===
      404
    ) {
      return {
        available: false,
        cached: false,
        synced: false,
        source: null,
        syncOffset,
        data: null,
        message:
          'Lyrics are not available for this song.',
      };
    }

    console.error(
      'LRCLIB request failed:',
      error.message
    );

    throw new Error(
      'Unable to fetch lyrics right now'
    );
  }

  // -------------------------------------------------------
  // 3. VALIDATE PROVIDER MATCH
  // -------------------------------------------------------

  const providerMatches =
    validateProviderMatch({
      lyricsData,
      songName,
      artistName,
      albumName,
      duration,
    });

  if (!providerMatches) {
    console.warn(
      `LRCLIB result rejected for "${songName}" by "${artistName}".`
    );

    // We can still use plain lyrics,
    // but we must not trust synced timestamps.
    lyricsData.syncedLyrics = '';
  }

  // -------------------------------------------------------
  // 4. EXTRACT LYRICS
  // -------------------------------------------------------

  const plainLyrics =
    typeof lyricsData?.plainLyrics ===
    'string'
      ? lyricsData.plainLyrics.trim()
      : '';

  const rawSyncedLyrics =
    typeof lyricsData?.syncedLyrics ===
    'string'
      ? lyricsData.syncedLyrics.trim()
      : '';

  // -------------------------------------------------------
  // PARSE ORIGINAL LRCLIB TIMESTAMPS
  // -------------------------------------------------------

  const parsedProviderLyrics =
    parseSyncedLyrics(
      rawSyncedLyrics
    );

  // -------------------------------------------------------
  // APPLY SONG-SPECIFIC CORRECTION
  // -------------------------------------------------------

  const parsedSyncedLyrics =
    applySyncOffset(
      parsedProviderLyrics,
      syncOffset
    );

  // -------------------------------------------------------
  // PROVIDER DURATION
  // -------------------------------------------------------

  const providerDuration =
    Number(
      lyricsData?.duration
    );

  const safeProviderDuration =
    Number.isFinite(
      providerDuration
    ) &&
    providerDuration > 0
      ? providerDuration
      : 0;

  // -------------------------------------------------------
  // 5. VALIDATE TIMESTAMPS
  // -------------------------------------------------------

  const syncedLyricsValid =
    providerMatches &&
    validateSyncedLyrics({
      syncedLyrics:
        parsedSyncedLyrics,
      requestedDuration:
        duration,
      providerDuration:
        safeProviderDuration,
    });

  const syncedLyrics =
    syncedLyricsValid
      ? parsedSyncedLyrics
      : [];

  const hasPlainLyrics =
    plainLyrics.length > 0;

  const hasSyncedLyrics =
    syncedLyrics.length > 0;

  // -------------------------------------------------------
  // DEBUG INFORMATION
  // -------------------------------------------------------

  console.log(
    `Lyrics result: ${songName} | synced=${hasSyncedLyrics} | lines=${syncedLyrics.length} | providerDuration=${safeProviderDuration}s | requestedDuration=${duration}s | syncOffset=${syncOffset}s`
  );

  // -------------------------------------------------------
  // DEBUG FIRST FEW LINES
  // -------------------------------------------------------

  if (hasSyncedLyrics) {
    console.log(
      'First synced lyrics:',
      syncedLyrics
        .slice(0, 5)
        .map((line) => ({
          time: line.time,
          text: line.text,
        }))
    );
  }

  // -------------------------------------------------------
  // 6. CHECK AVAILABILITY
  // -------------------------------------------------------

  if (
    !hasPlainLyrics &&
    !hasSyncedLyrics
  ) {
    return {
      available: false,
      cached: false,
      synced: false,
      source: null,
      syncOffset,
      data: null,
      message:
        'Lyrics are not available for this song.',
    };
  }

  // -------------------------------------------------------
  // 7. SAVE TO MONGODB
  //
  // IMPORTANT:
  // syncOffset is currently returned dynamically.
  // We will add it to the MongoDB model in the next step
  // so the correction can also be persisted.
  // -------------------------------------------------------

  const lyricsDocument =
    await Lyrics.findOneAndUpdate(
      {
        songId: String(songId),
      },
      {
        $set: {
          songId:
            String(songId),

          songName:
            cleanText(
              songName
            ),

          artistName:
            cleanText(
              artistName
            ),

          lyrics:
            plainLyrics,

          syncedLyrics,

          isSynced:
            hasSyncedLyrics,

          source:
            'lyrics-api',

          lastAccessedAt:
            new Date(),
        },
      },
      {
        returnDocument:
          'after',
        upsert: true,
        setDefaultsOnInsert:
          true,
      }
    ).lean();

  // -------------------------------------------------------
  // 8. RETURN RESULT
  // -------------------------------------------------------

  return {
    available: true,
    cached: false,
    synced:
      hasSyncedLyrics,
    source:
      'lyrics-api',
    syncOffset,
    data: {
      ...lyricsDocument,
      syncOffset,
    },
  };
};

module.exports = {
  getLyrics,
  parseSyncedLyrics,
  getSyncOffset,
};