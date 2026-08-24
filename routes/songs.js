const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE_URL = process.env.JIOSAAVN_API;

// Search for songs
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const response = await axios.get(`${BASE_URL}/api/search/songs`, {
      params: { query }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Get a single song's details by ID
router.get('/song/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${BASE_URL}/api/songs/${id}`);

    res.json(response.data);
  } catch (error) {
    console.error('Song fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch song details' });
  }
});

// Combined search - like Spotify (songs, artists, albums, playlists together)
router.get('/search-all', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const response = await axios.get(`${BASE_URL}/api/search`, {
      params: { query }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Combined search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

// Get album details by ID
router.get('/album/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/api/albums`, {
      params: { id }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Album fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch album details' });
  }
});

// Get artist details by ID
router.get('/artist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/api/artists`, {
      params: { id }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Artist fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch artist details' });
  }
});

// Get playlist details by ID
router.get('/playlist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/api/playlists`, {
      params: { id }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Playlist fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch playlist details' });
  }
});

// Build a "radio" queue based on language of the current song
router.get('/radio', async (req, res) => {
  try {
    const { language, artist } = req.query;

    if (!language) {
      return res.status(400).json({ error: 'Language parameter is required' });
    }

    // Search using the artist name (better relevance) or fallback to language name
    const searchTerm = artist || language;

    const response = await axios.get(`${BASE_URL}/api/search/songs`, {
      params: { query: searchTerm, limit: 20 }
    });

    // Filter to keep only songs matching the same language, for consistency
    const allSongs = response.data.data.results || [];
    const filtered = allSongs.filter(song => song.language === language);

    res.json({ success: true, data: filtered.length > 0 ? filtered : allSongs });
  } catch (error) {
    console.error('Radio error:', error.message);
    res.status(500).json({ error: 'Failed to fetch radio queue' });
  }
});

// Home page - curated sections using popular searches
router.get('/home', async (req, res) => {
  try {
    const categories = [
      { title: 'Trending Now', query: 'trending 2026' },
      { title: 'Bollywood Hits', query: 'bollywood hits' },
      { title: 'Arijit Singh', query: 'arijit singh' },
      { title: 'Punjabi Vibes', query: 'punjabi hits' },
      { title: 'Romantic Songs', query: 'romantic hindi songs' },
      { title: 'English Hits', query: 'english top songs' },
    ];

    const requests = categories.map((cat) =>
      axios.get(`${BASE_URL}/api/search/songs`, {
        params: { query: cat.query, limit: 10 }
      })
    );

    const responses = await Promise.all(requests);

    const sections = categories.map((cat, index) => ({
      title: cat.title,
      songs: responses[index].data.data.results || []
    }));

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Home fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch home data' });
  }
});

module.exports = router;
