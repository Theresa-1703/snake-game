# Snake Monorepo

Ein modernes Monorepo mit:
- apps/web: React + Vite + TypeScript + Tailwind (UI)
- packages/game-core: TypeScript-Spiel-Logik (framework-unabhängig)

## Voraussetzungen
- Node.js >= 18
- npm (empfohlen)

## Installation
```cmd
npm install
```

## Entwicklung starten
Startet die Game-Core-TS-Watch und den Vite-Dev-Server parallel.
```cmd
npm run dev
```
Öffne anschließend: http://localhost:5173

Steuerung im Spiel:
- Pfeiltasten oder WASD: Richtung ändern
- Leertaste: Pause / Fortsetzen
- R: Neustart

## Build
Baut zuerst das Core-Paket und anschließend die Web-App.
```cmd
npm run build
```

## Vorschau eines Builds
```cmd
npm run -w @snake/web preview
```

## Repo-Struktur
```
.
├─ apps/
│  └─ web/           # Vite React App
├─ packages/
│  └─ game-core/     # Snake Logik (TypeScript)
├─ package.json       # npm workspaces
├─ tsconfig.base.json # shared TS base config
└─ README.md
```

## Lizenz
MIT

