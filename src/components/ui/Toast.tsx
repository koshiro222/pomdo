import { useEffect } from 'react'

export function Toast({ message, onClose, role = 'status' }: { message: string | null; onClose: () => void; role?: 'status' | 'alert' }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(onClose, 3600)
    return () => window.clearTimeout(timer)
  }, [message, onClose])
  return message ? <div className="toast alert alert-info" role={role}>{message}</div> : null
}
