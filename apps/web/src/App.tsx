import { useState } from 'react'
import SnakeCanvas from './components/SnakeCanvas'

export default function App() {
  const [wrap, setWrap] = useState(true)
  const [cols, setCols] = useState(24)
  const [rows, setRows] = useState(24)
  const [speed, setSpeed] = useState(10) // ticks per second
  const [pauseSig, setPauseSig] = useState(0)
  const [restartSig, setRestartSig] = useState(0)
  const [pausedLabel, setPausedLabel] = useState(false)

  const onPauseToggle = () => { setPauseSig(s => s + 1) }
  const onRestart = () => { setRestartSig(s => s + 1) }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300 bg-clip-text text-transparent">Snake</span>
          </h1>
          <a className="text-sm text-slate-300/80 hover:text-slate-100 transition" href="https://en.wikipedia.org/wiki/Snake_(video_game_genre)" target="_blank" rel="noreferrer">Was ist Snake?</a>
        </div>
      </header>

      <main className="flex-1 pb-10">
        <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[75vh]">
            <SnakeCanvas
              cols={cols}
              rows={rows}
              wrap={wrap}
              speed={speed}
              pauseSignal={pauseSig}
              restartSignal={restartSig}
              onPauseChange={setPausedLabel}
            />
          </div>

          <div className="flex flex-col gap-4">
            {/* Buttons: volle Spaltenbreite, untereinander, größer */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onPauseToggle}
                className={`w-full h-12 rounded-lg ring-1 ring-white/15 bg-white/10 hover:bg-white/15 text-white/90 transition whitespace-nowrap ${pausedLabel ? 'text-sm' : 'text-base'}`}
              >
                {pausedLabel ? 'Fortsetzen' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full h-12 rounded-lg ring-1 ring-white/15 bg-white/10 hover:bg-white/15 text-white/90 transition text-base"
              >
                Neustart
              </button>
            </div>

            <aside className="rounded-2xl bg-white/5 shadow-glass backdrop-blur-md ring-1 ring-white/10 p-5 h-fit">
              <h2 className="text-lg font-semibold mb-4">Einstellungen</h2>

              <div className="space-y-5">
                <div>
                  <label className="flex items-center justify-between">
                    <span>Wände umgehen</span>
                    <input type="checkbox" className="size-4 accent-primary-500" checked={wrap} onChange={e => setWrap(e.target.checked)} />
                  </label>
                  <p className="text-xs text-slate-400 mt-1">Wenn aktiv, taucht die Schlange auf der gegenüberliegenden Seite wieder auf.</p>
                </div>

                <div>
                  <label className="text-sm text-slate-300">Geschwindigkeit: <b>{(speed < 1 ? speed.toFixed(1) : speed)}</b></label>
                  <input className="w-full" type="range" min={1} max={15} step={1} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
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
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Snake. Alle Rechte vorbehalten.</p>
          <nav className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-200 transition-colors">Impressum</a>
            <span className="text-slate-600">•</span>
            <a href="#" className="hover:text-slate-200 transition-colors">Datenschutz</a>
            <span className="text-slate-600">•</span>
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:text-slate-200 transition-colors">GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
