const express = require('express')
const router = express.Router()

async function searchWatchingTmdb(q) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(q)}&page=1&include_adult=false`
  )
  const data = await res.json()
  return (data.results || [])
    .filter(r => r.media_type !== 'person' && r.poster_path)
    .slice(0, 8)
    .map(r => ({
      title: r.title || r.name,
      subtitle: [
        r.media_type === 'tv' ? 'TV Series' : 'Movie',
        (r.release_date || r.first_air_date || '').slice(0, 4),
      ].filter(Boolean).join(' · '),
      imageUrl: `https://image.tmdb.org/t/p/w200${r.poster_path}`,
    }))
}

async function searchPlaying(q) {
  const res = await fetch(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`,
    { headers: { 'Accept': 'application/json' } }
  )
  const data = await res.json()
  return (data.items || []).slice(0, 8).map(r => ({
    title: r.name,
    subtitle: r.price?.final ? `$${(r.price.final / 100).toFixed(2)}` : 'Free',
    // Steam portrait library art — great for the shelf
    imageUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${r.id}/library_600x900.jpg`,
  }))
}

router.get('/search', async (req, res) => {
  const { type, q } = req.query
  if (!q?.trim() || !type) return res.json({ results: [], fallback: false })

  try {
    if (type === 'watching' && process.env.TMDB_KEY) {
      const results = await searchWatchingTmdb(q)
      return res.json({ results, fallback: false })
    }
    if (type === 'playing') {
      const results = await searchPlaying(q)
      return res.json({ results, fallback: results.length === 0 })
    }
    // reading + listening handled client-side; signal fallback
    res.json({ results: [], fallback: true })
  } catch (err) {
    console.error('media search error:', err.message)
    res.json({ results: [], fallback: true })
  }
})

module.exports = router
