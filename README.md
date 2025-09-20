# World of Bookcraft

World of Bookcraft is an immersive studio for crafting richly illustrated baby and toddler picture books. Supply a detailed intent – theme, lesson, tone, characters, and aesthetic cues – and the app weaves a multi-page narrative plus illustration prompts, passing them to Gemini/Nanobanana for cohesive visuals. Everything is wrapped in a pixel-inspired reading experience with continuity-aware image generation.

## Highlights

- **Passcode-Gated Studio** – Visitors land on `/login`; enter the shared passcode `family` to access the studio. Middleware keeps APIs and the reader locked down.
- **Story Intent Composer** – Capture expansive themes (800 chars), lessons (600 chars), and up to 6 characters with 600-char descriptions and reference art.
- **Continuity-Aware Art Pipeline** – The image generator feeds prior page frames and only relevant character references to Gemini, preserving style and cast from scene to scene.
- **Immersive Reader Overlay** – Opens books full-screen with minimal chrome, keyboard navigation, and optional “Illustrator notes” popovers so artwork dominates the screen.
- **Persistent Library** – Generated books are stored in `data/books.json`; reopen any story instantly or replace the storage with your own DB/disk.

## Quick Start

```bash
cd web
npm install
npm run dev
```

- Visit `http://localhost:3000` → you’ll be redirected to `/login`.
- Enter the passcode `family` to load the studio at `/studio`.

## Environment Variables

Create `web/.env.local` (same folder as `package.json`) and supply keys as needed:

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | Enables real story generation (defaults to model `gpt-4.1`). |
| `OPENAI_STORY_MODEL` | optional | Override the story model ID. |
| `GEMINI_API_KEY` | optional | Enables Gemini image generation (falls back to placeholders without it). |
| `GEMINI_IMAGE_MODEL` | optional | Defaults to `gemini-2.5-flash-image-preview`. |
| `NANOBANANA_API_KEY` / `NANOBANANA_MODEL` | optional | Legacy Nanobanana support if you prefer that provider. |

> The login passcode is intentionally hard-coded (`family`). Update `src/lib/auth/constants.ts` if you want a different secret.

For Render/other hosts, add the same environment variables in the service dashboard. The app never exposes secrets to the browser; all requests are handled server-side.

## File Storage

By default, generated books are appended to `data/books.json`. For production you should:

1. Mount a persistent disk (Render Disk, AWS EFS, etc.) and point `data/` at it, **or**
2. Replace the repository layer (`src/lib/repository/book-repository.ts`) with your database/object store of choice.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server with hot reload. |
| `npm run lint` | ESLint over the entire project. |
| `npm run test` | Vitest unit tests (story/image generator, orchestrator, validators). |
| `npm run build` | Production build with type-checking and lint. |

**Recommended pre-push checklist:** `npm run lint && npm test && npm run build`

## Architecture Overview

- **Routes** –
  - `/` redirects to `/login` (or `/studio` if session cookie exists).
  - `/login` hosts the passcode form (client component with `/api/login` POST).
  - `/studio` renders the intent form, library shelf, and viewer.
- **Middleware** – `middleware.ts` protects every route/API except `/login`, `/api/login`, static assets, and the Next internals.
- **State** – `src/state/book-store.ts` (Zustand) maintains the current intent, active book, progress trace, and overlay controls.
- **Services** – `src/lib/services/story-generator.ts` and `image-generator.ts` coordinate model prompts; `story-orchestrator.ts` stitches them together and persists output.
- **Validation** – Zod schemas (`src/lib/validation`) ensure we accept and emit richly detailed payloads without truncating creative input.
- **UI** – Pixel-styled components in `src/components/` (IntentForm, StudioShell, BookViewer, LibraryShelf).

## Deployment Notes

- Target the `web` directory if deploying from the monorepo.
- Use Node 20 (`NODE_VERSION=20`) to match local builds.
- Configure env vars (above) and mount persistent storage for `data/books.json` if you need durability.
- Build command: `npm install && npm run build`
- Start command: `npm run start`

## Roadmap Ideas

- Multi-user authentication & individual libraries.
- Streaming job updates for page-by-page image status.
- Exports to printable PDF spreads / EPUB.
- Hooks into S3 or Firestore for cloud asset storage.

Enjoy weaving pixel-perfect tales in the World of Bookcraft! ✨
