import { useEffect, useMemo, useRef, useState } from 'react'
import RouletteWheel from './components/RouletteWheel'
import Chat from './components/Chat'

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const wsUrl = useMemo(() => baseUrl.replace('http', 'ws') + '/ws', [baseUrl])

  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('connecting...')
  const [result, setResult] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onopen = () => setStatus('connected')
    ws.onclose = () => setStatus('disconnected')
    ws.onerror = () => setStatus('error')
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'chat') {
          setMessages(prev => [...prev, { user: data.user, message: data.message }])
        } else if (data.type === 'spin') {
          setResult(data.result)
          const who = data.trigger?.user ? ` (by ${data.trigger.user})` : ''
          setMessages(prev => [...prev, { user: 'SYSTEM', message: `Spin! Result ${data.result.number} ${data.result.color}${who}` }])
        } else if (data.type === 'twitch_status') {
          setMessages(prev => [...prev, { user: 'TWITCH', message: `Status: ${data.status}${data.channel ? ' #' + data.channel : ''}` }])
        } else if (data.type === 'welcome') {
          setMessages(prev => [...prev, { user: 'SYSTEM', message: data.message }])
        }
      } catch (err) {}
    }
    return () => ws.close()
  }, [wsUrl])

  const manualSpin = async () => {
    await fetch(baseUrl + '/spin', { method: 'POST' })
  }

  const configureTwitch = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const nick = form.get('nick')
    const token = form.get('token')
    const channel = form.get('channel')
    const res = await fetch(baseUrl + '/twitch/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, token, channel })
    })
    const data = await res.json()
    setMessages(prev => [...prev, { user: 'TWITCH', message: `Connecting to #${data.channel}...` }])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Twitch Roulette</h1>
            <p className="text-slate-300 text-sm">WebSocket: {status}</p>
          </div>
          <button onClick={manualSpin} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg">Spin now</button>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-4">
            <RouletteWheel lastResult={result} />
            {result && (
              <div className="text-center">
                <div className="text-xl font-semibold">{result.number}</div>
                <div className="text-sm text-slate-300">{result.color}</div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <h2 className="font-semibold mb-3">Twitch connection</h2>
              <form onSubmit={configureTwitch} className="space-y-3">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm text-slate-300">Nick</label>
                  <input name="nick" required placeholder="your_twitch_username" className="col-span-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm text-slate-300">OAuth Token</label>
                  <input name="token" required placeholder="oauth:xxxxxxxxxxxxxxxx" className="col-span-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm text-slate-300">Channel</label>
                  <input name="channel" required placeholder="channel_name" className="col-span-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-lg">Connect</button>
                <p className="text-xs text-slate-400">Type !bet in chat to trigger a spin.</p>
              </form>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Live chat</h2>
              <Chat messages={messages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
