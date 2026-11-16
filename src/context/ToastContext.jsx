import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const show = useCallback((message, type = 'success') => {
    const id = Math.random()
    setItems((list) => [...list, { id, message, type }])
    setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 4000)
  }, [])

  const api = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className="flex max-w-md items-center gap-2 rounded-ui bg-fg px-4 py-2 text-body text-bg shadow-raised">
            {i.type === 'error' ? <XCircle className="text-danger" /> : <CheckCircle2 className="text-success" />}
            {i.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
