import { useMemo, useState } from 'react'
import SnakeCanvas from './components/SnakeCanvas'

export default function App() {
  const [wrap, setWrap] = useState(true)
  const [cols, setCols] = useState(24)
  const [rows, setRows] = useState(24)
  const [speed, setSpeed] = useState(10) // ticks per second
  const key = useMemo(() => `${cols}x${rows}-${wrap}`, [cols, rows, wrap])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300 bg-clip-text text-transparent">Snake</span>
            <span className="ml-2 text-slate-300 text-base align-middle">modern edition</span>
          </h1>
          <a className="text-sm text-slate-300/80 hover:text-slate-100 transition" href="https://en.wikipedia.org/wiki/Snake_(video_game_genre)" target="_blank" rel="noreferrer">Was ist Snake?</a>
        </div>
      </header>

      <main className="flex-1 pb-10">
        <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="relative rounded-2xl bg-white/5 shadow-glass backdrop-blur-md ring-1 ring-white/10 p-4">
            <SnakeCanvas key={key} cols={cols} rows={rows} wrap={wrap} speed={speed} />
          </div>

          <aside className="rounded-2xl bg-white/5 shadow-glass backdrop-blur-md ring-1 ring-white/10 p-5 h-fit">
            <h2 className="text-lg font-semibold mb-4">Einstellungen</h2>

            <div className="space-y-5">
              <div>
                <label className="flex items-center justify-between">
                  <span>Wände umwickeln</span>
                  <input type="checkbox" className="size-4 accent-primary-500" checked={wrap} onChange={e => setWrap(e.target.checked)} />
                </label>
                <p className="text-xs text-slate-400 mt-1">Wenn aktiv, taucht die Schlange auf der gegenüberliegenden Seite wieder auf.</p>
              </div>

              <div>
                <label className="text-sm text-slate-300">Geschwindigkeit: <b>{speed}</b></label>
                <input className="w-full" type="range" min={5} max={20} step={1} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300">Spalten: <b>{cols}</b></label>
                  <input className="w-full" type="range" min={12} max={40} step={2} value={cols} onChange={e => setCols(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm text-slate-300">Zeilen: <b>{rows}</b></label>
                  <input className="w-full" type="range" min={12} max={40} step={2} value={rows} onChange={e => setRows(Number(e.target.value))} />
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-2">
                Steuerung: Pfeiltasten oder WASD. Leertaste: Pause/Fortsetzen. R: Neustart.
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        Gebaut mit React, Vite, TypeScript & Tailwind.
      </footer>
    </div>
  )
}

