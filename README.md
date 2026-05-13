# Scratch-o-matic

Vue 3 + Vite + TypeScript (strict) + Tailwind CSS v4 + Pinia + Vue Router. In-browser scratching over a beat: upload or record a sample, pick a static beat from `/public/beats`, then use the studio (manual drag, cue patterns, auto-scratch, Magic heuristics, WAV export). **Firebase is optional** — set `VITE_USE_FIREBASE=true` and fill `.env.local` from [`.env.example`](.env.example); otherwise everything runs as **guest** with optional IndexedDB keys via [`src/services/localPersist.ts`](src/services/localPersist.ts).

## Scripts

| Command        | Description                |
| -------------- | -------------------------- |
| `pnpm dev`     | Vite dev server            |
| `pnpm build`   | `vue-tsc` + production build |
| `pnpm preview` | Preview production build   |
| `pnpm lint`    | ESLint                     |
| `pnpm format`  | Prettier write             |
| `pnpm test`    | Vitest unit tests          |

## Placeholder beats

[`public/beats/index.json`](public/beats/index.json) lists stub entries (silent 1-bar WAVs). The `notes` field documents: **TODO: echte Beats vom User produziert einfügen**. Regenerate stubs with:

```bash
node scripts/gen-placeholder-beats.mjs
```

## Environment (Firebase)

Copy [`.env.example`](.env.example) to **`.env.local`** and set real values there. That file is gitignored (`*.local`). Never commit API keys. Optional: `VITE_FIREBASE_MEASUREMENT_ID` for Analytics-linked projects.

## Vercel

[`vercel.json`](vercel.json) rewrites all routes to `index.html` for SPA routing. Build: `pnpm build`, output directory: `dist`. Set the same env vars in the Vercel project if you use Firebase.

## Audio notes

- **Web Audio** graph uses `latencyHint: 'interactive'` ([`src/composables/useAudioContext.ts`](src/composables/useAudioContext.ts)).
- **Wavesurfer.js** is used **only for waveform UI**; playback and scratching use `AudioBufferSourceNode` ([`src/audio/simplePlayer.ts`](src/audio/simplePlayer.ts), [`src/audio/scratchEngine.ts`](src/audio/scratchEngine.ts)).
- **Safari**: negative `playbackRate` is not supported — backward motion uses a **pre-reversed buffer** (see comments in `scratchEngine`).
- **Export** ([`src/audio/exporter.ts`](src/audio/exporter.ts)): MVP mixes two linear sources at the current crossfader and pitch multipliers; extending with an event log would replay full scratch gestures offline.

## Keyboard shortcuts (Studio)

| Key | Action              |
| --- | ------------------- |
| Space | Toggle beat + sample play |
| M   | Magic (heuristic cues) |
| 1–8 | Fire cue pattern (sorted order) |

## Tech choices documented

- **Tailwind v4**: `@import "tailwindcss"` + `@theme` in [`src/style.css`](src/style.css); Vite plugin `@tailwindcss/vite` (no legacy `tailwind.config.js`).
- **UI primitives**: custom Tailwind components under [`src/components/ui/`](src/components/ui/) (no shadcn in MVP).
- **Magic**: rule-based [`HeuristicMagicStrategy`](src/audio/magic.ts) using Meyda; `MagicStrategy` interface is ready for a future remote/ML implementation.
