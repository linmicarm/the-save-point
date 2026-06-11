import axios from 'axios'

/**
 * Resize image to maxWidth via canvas, then upload to /api/upload.
 * Falls back to storing the base64 dataURL directly if /api/upload returns 503
 * (Cloudinary not configured). Returns the final URL string.
 */
export async function uploadImage(file, folder = 'misc', maxWidth = 1200) {
  // resize via canvas
  const dataUrl = await new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = e => { img.src = e.target.result }
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  try {
    const res = await axios.post('/api/upload', { data: dataUrl, folder })
    return res.data.url
  } catch (err) {
    if (err.response?.status === 503) {
      // Cloudinary not configured — store base64 directly (dev/demo mode)
      return dataUrl
    }
    throw err
  }
}
