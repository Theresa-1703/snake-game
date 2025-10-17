import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Direction, GameConfig, GameState } from '@snake/game-core'
import { changeDirection, createInitialState, step } from '@snake/game-core'

type Props = {
  cols: number
  rows: number
  wrap: boolean
  speed: number // ticks per second
}

const dirByKey: Record<string, Direction | 'pause' | 'restart' | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up', W: 'up',
  s: 'down', S: 'down',
  a: 'left', A: 'left',
  d: 'right', D: 'right',
  ' ': 'pause',
  r: 'restart', R: 'restart',
}

export default function SnakeCanvas({ cols, rows, wrap, speed }: Props) {
  const config: GameConfig = useMemo(() => ({ cols, rows, wrap, initialLength: 5 }), [cols, rows, wrap])
  const [state, setState] = useState<GameState>(() => createInitialState(config))
  const [isPaused, setPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const pixelRatioRef = useRef<number>(1)

  // Restart when config changes (parent provides key but we guard too)
  useEffect(() => {
    setState(createInitialState(config))
    setPaused(false)
  }, [config])

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const m = dirByKey[e.key]
      if (!m) return
      e.preventDefault()
      if (m === 'pause') {
        setPaused(p => !p)
        return
      }
      if (m === 'restart') {
        setState(createInitialState(config))
        setPaused(false)
        return
      }
      setState(prev => {
        const next = { ...prev }
        changeDirection(next, m)
        return next
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [config])

  // Game loop (logic) via setInterval
  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (isPaused) return
    const ms = Math.max(30, Math.floor(1000 / speed))
    const id = window.setInterval(() => {
      setState(prev => step(config, prev))
    }, ms)
    intervalRef.current = id
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [config, speed, isPaused])

  // Resize canvas to fit container while keeping cell aspect 1:1
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const pr = Math.min(window.devicePixelRatio || 1, 2)
    pixelRatioRef.current = pr

    const { clientWidth, clientHeight } = container
    const cellSize = Math.floor(Math.min(clientWidth / cols, clientHeight / rows))
    const width = cellSize * cols
    const height = cellSize * rows

    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    canvas.width = Math.floor(width * pr)
    canvas.height = Math.floor(height * pr)
  }, [cols, rows])

  useEffect(() => {
    resizeCanvas()
    const ro = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [resizeCanvas])

  // Rendering with requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')! // non-null assertion for TS

    function draw() {
      const pr = pixelRatioRef.current
      const w = canvas.width
      const h = canvas.height
      const cellW = w / cols
      const cellH = h / rows

      // Background grid (subtle)
      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#0f172a')
      grad.addColorStop(1, '#111827')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.045)'
      ctx.lineWidth = Math.max(1, pr)
      ctx.beginPath()
      for (let i = 1; i < cols; i++) {
        const x = Math.floor(i * cellW) + 0.5
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
      }
      for (let j = 1; j < rows; j++) {
        const y = Math.floor(j * cellH) + 0.5
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
      }
      ctx.stroke()

      // Food (glow)
      if (state.food.x >= 0) {
        const fx = state.food.x * cellW + cellW / 2
        const fy = state.food.y * cellH + cellH / 2
        const r = Math.min(cellW, cellH) * 0.35
        const glow = ctx.createRadialGradient(fx, fy, r * 0.2, fx, fy, r * 1.6)
        glow.addColorStop(0, 'rgba(250, 204, 21, 0.85)') // amber-400
        glow.addColorStop(1, 'rgba(250, 204, 21, 0.0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(fx, fy, r * 1.6, 0, Math.PI * 2)
        ctx.fill()

        const foodGrad = ctx.createLinearGradient(fx - r, fy - r, fx + r, fy + r)
        foodGrad.addColorStop(0, '#fde047')
        foodGrad.addColorStop(1, '#f59e0b')
        ctx.fillStyle = foodGrad
        ctx.beginPath()
        ctx.arc(fx, fy, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Snake
      const snakeGrad = ctx.createLinearGradient(0, 0, w, h)
      snakeGrad.addColorStop(0, '#22c55e')
      snakeGrad.addColorStop(1, '#16a34a')
      ctx.fillStyle = snakeGrad

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      const r = Math.min(cellW, cellH) * 0.28
      for (let i = state.snake.length - 1; i >= 0; i--) {
        const seg = state.snake[i]
        const x = seg.x * cellW
        const y = seg.y * cellH
        const pad = Math.max(1, r)
        roundRect(ctx, x + pad, y + pad, cellW - 2 * pad, cellH - 2 * pad, r)
        ctx.fill()

        // Head details
        if (i === 0) {
          // Eyes
          const cx = x + cellW / 2
          const cy = y + cellH / 2
          const eyeR = Math.max(1.5 * pixelRatioRef.current, Math.min(cellW, cellH) * 0.06)
          const offset = Math.min(cellW, cellH) * 0.18
          ctx.fillStyle = '#fff'
          ctx.beginPath(); ctx.arc(cx - offset, cy - offset, eyeR, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(cx + offset, cy - offset, eyeR, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#0f172a'
          ctx.beginPath(); ctx.arc(cx - offset, cy - offset, eyeR * 0.5, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(cx + offset, cy - offset, eyeR * 0.5, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = snakeGrad
        }
      }

      // HUD
      const scoreText = `Score: ${state.score}`
      ctx.font = `${14 * pr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(scoreText, 12 * pr, 20 * pr)

      if (isPaused && !state.isGameOver) {
        overlayText(ctx, w, h, 'PAUSE')
      }
      if (state.isGameOver) {
        overlayText(ctx, w, h, 'GAME OVER')
      }

      rafRef.current = window.requestAnimationFrame(draw)
    }
    rafRef.current = window.requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [cols, rows, state, isPaused])

  const onRestart = () => {
    setState(createInitialState(config))
    setPaused(false)
  }
  const onPauseToggle = () => setPaused(p => !p)

  return (
    <div ref={containerRef} className="relative w-full aspect-square md:aspect-[4/3] mx-auto">
      <canvas ref={canvasRef} className="block w-full h-full rounded-xl ring-1 ring-white/10 shadow-lg"/>

      <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3 gap-2">
        <button onClick={onPauseToggle} className="pointer-events-auto bg-white/10 hover:bg-white/15 text-white/90 text-xs px-3 py-1.5 rounded-md ring-1 ring-white/15 transition">
          {isPaused ? 'Fortsetzen' : 'Pause'}
        </button>
        <button onClick={onRestart} className="pointer-events-auto bg-white/10 hover:bg-white/15 text-white/90 text-xs px-3 py-1.5 rounded-md ring-1 ring-white/15 transition">
          Neustart
        </button>
      </div>
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function overlayText(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  ctx.save()
  ctx.fillStyle = 'rgba(2,6,23,0.45)'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#e5e7eb'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const pr = Math.min(window.devicePixelRatio || 1, 2)
  ctx.font = `${28 * pr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  ctx.fillText(text, w / 2, h / 2)
  ctx.restore()
}
