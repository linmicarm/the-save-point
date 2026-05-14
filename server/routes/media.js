const express = require('express')
const router = express.Router()

async function searchWatching(q) {
  const [movRes, tvRes] = await Promise.all([
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=movie&entity=movie&limit=4`),
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=tvShow&entity=tvSeason&limit=3`),
  ])
  const [mov, tv] = await Promise.all([movRes.json(), tvRes.json()])
  return [
    ...(mov.results || []).map(r => ({
      title: r.trackName,
      subtitle: [r.primaryGenreName, r.releaseDate?.slice(0, 4)].filter(Boolean).join(' · '),
      imageUrl: r.artworkUrl60?.replace('60x60bb', '100x100bb'),
    })),
    ...(tv.results || []).map(r => ({
      title: r.collectionName || r.trackName,
      subtitle: ['TV Series', r.releaseDate?.slice(0, 4)].filter(Boolean).join(' · '),
      imageUrl: r.artworkUrl60?.replace('60x60bb', '100x100bb'),
    })),
  ].slice(0, 6)
}

async function searchReading(q) {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=6&fields=title,author_name,first_publish_year,cover_i`
  )
  const data = await res.json()
  return (data.docs || []).slice(0, 6).map(r => ({
    title: r.title,
    subtitle: [r.author_name?.[0], r.first_publish_year].filter(Boolean).join(' · '),
    imageUrl: r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-S.jpg` : null,
  }))
}

async function searchListening(q) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=6`
  )
  const data = await res.json()
  return (data.results || []).map(r => ({
    title: r.trackName,
    subtitle: [r.artistName, r.collectionName].filter(Boolean).join(' · '),
    imageUrl: r.artworkUrl60?.replace('60x60bb', '100x100bb'),
  }))
}

async function searchPlaying(q) {
  if (!process.env.RAWG_KEY) return []
  const res = await fetch(
    `https://api.rawg.io/api/games?key=${process.env.RAWG_KEY}&search=${encodeURIComponent(q)}&page_size=6`
  )
  const data = await res.json()
  return (data.results || []).map(r => ({
    title: r.name,
    subtitle: r.genres?.map(g => g.name).slice(0, 2).join(', ') || '',
    imageUrl: r.background_image,
  }))
}

router.get('/search', async (req, res) => {
  const { type, q } = req.query
  if (!q?.trim() || !type) return res.json({ results: [] })

  try {
    let results = []
    if (type === 'watching')  results = await searchWatching(q)
    else if (type === 'reading')   results = await searchReading(q)
    else if (type === 'listening') results = await searchListening(q)
    else if (type === 'playing')   results = await searchPlaying(q)
    res.json({ results })
  } catch (err) {
    console.error('media search error:', err.message)
    res.json({ results: [] })
  }
})

module.exports = router
