import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Direction, GameConfig, GameState } from '@snake/game-core'
import { changeDirection, createInitialState, step } from '@snake/game-core'

type Props = {
  cols: number
  rows: number
  wrap: boolean
  speed: number // ticks per second
  pauseSignal?: number
  restartSignal?: number
  onPauseChange?: (paused: boolean) => void
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

export default function SnakeCanvas({ cols, rows, wrap, speed, pauseSignal, restartSignal, onPauseChange }: Props) {
  const config: GameConfig = useMemo(() => ({ cols, rows, wrap, initialLength: 5 }), [cols, rows, wrap])
  const [state, setState] = useState<GameState>(() => createInitialState(config))
  const [isPaused, setPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const pixelRatioRef = useRef<number>(1)

  // Signals aus dem Parent deduplizieren
  const lastPauseSignalRef = useRef<number | undefined>(pauseSignal)
  const lastRestartSignalRef = useRef<number | undefined>(restartSignal)

  // Nur bei Änderung der Grid-Dimensionen neu initialisieren (cols/rows), NICHT bei wrap
  const lastGridRef = useRef<{cols: number; rows: number}>({ cols, rows })
  useEffect(() => {
    const last = lastGridRef.current
    if (last.cols !== cols || last.rows !== rows) {
      setState(createInitialState({ cols, rows, wrap, initialLength: 5 }))
    }
    lastGridRef.current = { cols, rows }
  }, [cols, rows, wrap])

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
        setState(createInitialState({ cols, rows, wrap, initialLength: 5 }))
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
  }, [cols, rows, wrap])

  // Externe Steuerung: Pause toggeln
  useEffect(() => {
    if (pauseSignal === undefined) return
    if (lastPauseSignalRef.current !== pauseSignal) {
      setPaused(p => !p)
      lastPauseSignalRef.current = pauseSignal
    }
  }, [pauseSignal])

  // Externe Steuerung: Neustart
  useEffect(() => {
    if (restartSignal === undefined) return
    if (lastRestartSignalRef.current !== restartSignal) {
      setState(createInitialState({ cols, rows, wrap, initialLength: 5 }))
      setPaused(false)
      lastRestartSignalRef.current = restartSignal
    }
  }, [restartSignal, cols, rows, wrap])

  // Game loop (logic) via setInterval
  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (isPaused) return
    const ms = Math.max(30, Math.floor(1000 / speed))
    const id = window.setInterval(() => {
      setState(prev => step({ cols, rows, wrap }, prev))
    }, ms)
    intervalRef.current = id
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [cols, rows, wrap, speed, isPaused])

  // Resize canvas: volle Containergröße
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const pr = Math.min(window.devicePixelRatio || 1, 2)
    pixelRatioRef.current = pr

    const { clientWidth, clientHeight } = container
    canvas.style.width = clientWidth + 'px'
    canvas.style.height = clientHeight + 'px'
    canvas.width = Math.max(1, Math.floor(clientWidth * pr))
    canvas.height = Math.max(1, Math.floor(clientHeight * pr))
  }, [])

  useEffect(() => {
    resizeCanvas()
    const ro = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [resizeCanvas])

  // Rendering with requestAnimationFrame
  useEffect(() => {
    const canvasEl = canvasRef.current!
    if (!canvasEl) return
    const ctx = canvasEl.getContext('2d')!

    function draw() {
      const pr = pixelRatioRef.current
      const w = canvasEl.width
      const h = canvasEl.height
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
  }, [cols, rows, wrap, state, isPaused])

  // Parent über Pausenstatus informieren
  useEffect(() => {
    onPauseChange?.(isPaused)
  }, [isPaused, onPauseChange])

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="block"/>
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
