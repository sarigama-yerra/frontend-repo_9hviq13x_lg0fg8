import { useEffect, useRef } from 'react'

export default function Chat({ messages }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [messages])
  return (
    <div ref={ref} className="h-48 overflow-y-auto bg-slate-900/40 border border-slate-700 rounded-lg p-3 space-y-2">
      {messages.map((m, idx) => (
        <div key={idx} className="text-sm"><span className="text-slate-300 font-semibold">{m.user ? m.user+': ' : ''}</span><span className="text-slate-200">{m.message}</span></div>
      ))}
    </div>
  )
}
