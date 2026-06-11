const express = require('express')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2

const router = express.Router()

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authenticated.' })
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_KEY    || process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// POST /api/upload  body: { data: "data:image/...;base64,...", folder?: string }
router.post('/', requireAuth, async (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(503).json({ error: 'Image hosting not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.' })
  }
  const { data, folder } = req.body
  if (!data) return res.status(400).json({ error: 'No image data provided.' })
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    const result = await cloudinary.uploader.upload(data, {
      folder: `savepoint/${req.userId}/${folder || 'misc'}`,
      transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
    })
    res.json({ url: result.secure_url })
  } catch (err) {
    console.error('Cloudinary upload error:', err)
    res.status(500).json({ error: 'Upload failed.' })
  }
})

module.exports = router
