import { useEffect, useRef, useState } from 'react'

const sectors = Array.from({ length: 37 }, (_, i) => {
  const number = i
  const red = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])
  const color = number === 0 ? 'green' : red.has(number) ? 'red' : 'black'
  return { number, color }
})

export default function RouletteWheel({ lastResult }) {
  const canvasRef = useRef(null)
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const size = 360
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    const radius = size / 2
    ctx.clearRect(0,0,size,size)

    const step = (Math.PI * 2) / sectors.length
    sectors.forEach((s, idx) => {
      const start = idx * step + angle
      const end = start + step
      ctx.beginPath()
      ctx.moveTo(radius, radius)
      ctx.arc(radius, radius, radius - 4, start, end)
      ctx.closePath()
      ctx.fillStyle = s.color === 'red' ? '#ef4444' : s.color === 'black' ? '#111827' : '#10b981'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 2
      ctx.stroke()

      // number labels
      ctx.save()
      ctx.translate(radius, radius)
      ctx.rotate(start + step / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px Inter, system-ui, -apple-system, Segoe UI, Roboto'
      ctx.fillText(String(s.number), radius - 14, 4)
      ctx.restore()
    })

    // center
    ctx.beginPath()
    ctx.arc(radius, radius, 50, 0, Math.PI * 2)
    ctx.fillStyle = '#0ea5e9'
    ctx.fill()

    // pointer
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.lineTo(radius - 10, 20)
    ctx.lineTo(radius + 10, 20)
    ctx.closePath()
    ctx.fillStyle = '#f59e0b'
    ctx.fill()
  }, [angle])

  useEffect(() => {
    if (!lastResult) return
    const idx = sectors.findIndex(s => s.number === lastResult.number)
    if (idx === -1) return

    // compute target angle so that sector aligns under pointer at 0 rad
    const step = (Math.PI * 2) / sectors.length
    const target = - (idx * step + step / 2)

    setSpinning(true)
    const start = performance.now()
    const startAngle = angle
    const total = 3000 // ms
    const extraTurns = Math.PI * 6 // extra spin

    const raf = (t) => {
      const elapsed = t - start
      const progress = Math.min(elapsed / total, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startAngle + eased * (target + extraTurns - startAngle)
      setAngle(current)
      if (progress < 1) {
        requestAnimationFrame(raf)
      } else {
        setSpinning(false)
      }
    }
    requestAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult])

  return (
    <div className="relative inline-block">
      <canvas ref={canvasRef} className={"rounded-full shadow-xl " + (spinning ? 'animate-pulse' : '')}></canvas>
    </div>
  )
}
