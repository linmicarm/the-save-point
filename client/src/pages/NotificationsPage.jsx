import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getGroupLabel(iso) {
  const now = new Date()
  const date = new Date(iso)
  const diffDays = Math.floor((now - date) / 86400000)
  if (diffDays < 1) return 'Today'
  if (diffDays < 2) return 'Yesterday'
  if (diffDays < 7) return 'This week'
  return 'Earlier'
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier']

function typeMessage(type) {
  switch (type) {
    case 'like':           return 'liked your post'
    case 'comment':        return 'commented on your post'
    case 'blog_comment':   return 'commented on your blog post'
    case 'follow':         return 'started following you'
    case 'mention':        return 'mentioned you'
    default:               return type?.replace(/_/g, ' ') || 'interacted with you'
  }
}

function NotificationItem({ notif, accent, onDelete }) {
  const accentRgb = hexToRgb(accent)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(notif.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl group transition-colors"
      style={!notif.read ? { background: `rgba(${accentRgb}, 0.06)` } : { background: 'white' }}
    >
      {/* actor avatar */}
      <Link to={`/u/${notif.actor?.username}`} className="shrink-0 hover:opacity-80 transition-opacity mt-0.5">
        {notif.actor?.avatarUrl ? (
          <img
            src={notif.actor.avatarUrl}
            alt={notif.actor.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ background: accent }}
          >
            {(notif.actor?.displayName || notif.actor?.username || '?')[0].toUpperCase()}
          </div>
        )}
      </Link>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#3d3545] leading-snug">
          <Link
            to={`/u/${notif.actor?.username}`}
            className="font-medium text-[#2d2a35] hover:underline"
          >
            {notif.actor?.displayName || notif.actor?.username}
          </Link>
          {' '}
          <span className="text-[#7c6f9b]">{typeMessage(notif.type)}</span>
        </p>
        <p className="text-[10px] text-[#c4b8d9] mt-0.5">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* unread dot + delete */}
      <div className="flex items-center gap-2 shrink-0">
        {!notif.read && (
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[12px] text-[#d4cfe3] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
          title="dismiss"
        >
          {deleting ? '…' : '×'}
        </button>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const accent = user?.accentColor || '#c4b5fd'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/notifications')
        setNotifications(res.data.notifications || res.data || [])
        // mark all read
        axios.post('/api/notifications/read').catch(() => {})
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {
      showToast('could not dismiss notification', 'error')
      throw new Error('failed')
    }
  }

  // group by date label
  const grouped = GROUP_ORDER.reduce((acc, label) => {
    const items = notifications.filter(n => getGroupLabel(n.createdAt) === label)
    if (items.length) acc.push({ label, items })
    return acc
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-[#faf8ff] pt-2">
      <div className="h-0.5 w-full" style={{ background: accent }} />
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
            notifications
          </h1>
          {unreadCount > 0 && (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full text-white font-medium"
              style={{ background: accent }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-[#a89bc2] text-sm text-center py-16">loading...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-sm text-[#a89bc2]">no notifications yet</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-lg">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c4b8d9] mb-2 px-1">
                  {label}
                </p>
                <div className="space-y-1">
                  {items.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      accent={accent}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
