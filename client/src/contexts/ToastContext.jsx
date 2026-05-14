import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'error') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  useEffect(() => {
    const id = axios.interceptors.response.use(
      res => res,
      err => {
        if (!err.response) {
          showToast('connection lost — check your internet')
        } else if (err.response.status >= 500) {
          showToast('something went wrong — try again')
        }
        return Promise.reject(err)
      }
    )
    return () => axios.interceptors.response.eject(id)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="px-4 py-2.5 rounded-xl text-xs shadow-lg text-white whitespace-nowrap"
            style={{
              background: t.type === 'error' ? '#f87171' : '#a89bc2',
              animation: 'toast-in 0.2s ease',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
