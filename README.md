# AI Against Humanity

A multiplayer card game inspired by Cards Against Humanity — where AI personas with distinct personalities compete to create the funniest responses to hilarious prompts. Watch AI models battle each other, vote on winners, or jump in and compete alongside them in real-time.

## Game Modes

- **AI Battle Royale** — Watch AI models go head-to-head with zero human intervention
- **Human vs AI** — Compete directly against AI opponents
- **AI Judge** — Submit your responses and let an AI pick the winner
- **Collaborative** — Team up with an AI partner against other teams

## AI Personas

Each AI opponent has a unique personality and humor style:

| Persona | Style | Creativity |
|---------|-------|------------|
| Chaotic Carl | Absurd, random, surreal humor | 1.0 (High) |
| Sophisticated Sophie | Witty, intellectual wordplay | 0.7 (Medium) |
| Edgy Eddie | Dark humor, boundary-pushing | 0.9 (High) |
| Wholesome Wendy | Clean, family-friendly fun | 0.5 (Medium) |
| Literal Larry | Misses the joke, accidentally funny | 0.3 (Low) |

## Tech Stack

- **React 19** + **React Router 7** — Server-rendered UI with nested routing
- **Convex** — Real-time backend with automatic subscriptions (no WebSocket boilerplate)
- **OpenAI API** — AI response generation with per-persona temperature tuning
- **Tailwind CSS 4** — Neon-themed dark mode styling
- **Upstash Redis** — Rate limiting (optional)
- **Playwright** — End-to-end testing
- **TypeScript** — Throughout

## Getting Started

### Prerequisites

- Node.js 20+
- A [Convex](https://convex.dev) account
- An [OpenAI API key](https://platform.openai.com)

### Setup

```bash
npm install
```

Create a `.env` file:

```
VITE_CONVEX_URL=https://your-project.convex.cloud
```

Set backend secrets in the [Convex Dashboard](https://dashboard.convex.dev):

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Default OpenAI key for AI responses |
| `UPSTASH_REDIS_URL` | No | Enables rate limiting |
| `UPSTASH_REDIS_TOKEN` | No | Enables rate limiting |
| `ENCRYPTION_KEY` | For BYOK | 32-byte hex key for encrypting user API keys |

Generate an encryption key:
```bash
openssl rand -hex 32
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Custom API Credentials (BYOK)

Users can bring their own OpenAI API key to unlock premium features:

- **More AI players per game** — Up to 5 AI players (vs. 3 with the default key)
- **No rate limits** — Bypass the 10/min and 100/day per-game limits
- **Automatic fallback** — If a user's key fails, the system falls back to the default key

### How it works

1. User enters their API key on the **Settings** page (`/settings`)
2. The key is validated with a lightweight API call (listing models)
3. The key is encrypted with **AES-256-GCM** using the `ENCRYPTION_KEY` env var
4. The encrypted key is stored in the `userApiKeys` table in Convex
5. When the user hosts a game, the AI service decrypts and uses their key
6. The key is **never** sent to or stored on the frontend — encryption/decryption happens server-side in Convex actions

### Security

- Keys are encrypted at rest with AES-256-GCM (same standard as Vercel and AWS)
- The `ENCRYPTION_KEY` is stored in the Convex Dashboard, never in code
- Decryption only happens inside Convex actions at the moment of API call
- The frontend only sees a masked hint (e.g., `...7xQ2`)
- If a key is found to be invalid during gameplay, it's automatically marked as invalid

## Custom AI Personas

Users can create custom AI personalities:

1. Go to **Settings** (`/settings`)
2. Click **Create New Persona**
3. Configure:
   - **Name** — Display name (e.g., "Sarcastic Steve")
   - **Personality** — Short description shown in the game lobby
   - **Behavior Instructions** — Detailed prompt describing the AI's humor style
   - **Creativity** — Temperature slider from Focused (0.1) to Chaotic (1.2)
   - **Public/Private** — Public personas can be used by any player
4. Use your persona in the **Create Game** lobby

### Prompt safety

Custom persona prompts are wrapped with a system-level instruction that:
- Enforces the Cards Against Humanity game format
- Limits responses to short phrases
- Prevents prompt injection by always prefixing with game rules
- Bounds temperature to 0.1–1.2

### Production

```bash
npm run build
npm run start
```

Or with Docker:

```bash
docker build -t ai-against-humanity .
docker run -p 3000:3000 ai-against-humanity
```

## Testing

```bash
npm test                # Run all E2E tests
npm run test:unit       # Run unit tests (encryption, etc.)
npm run test:ui         # Playwright UI mode
npm run test:headed     # Tests with visible browser
npm run test:debug      # Debug mode
```

## Project Structure

```
app/
├── components/         # Reusable UI (GameBoard, PlayerList, Card, etc.)
│   ├── NotificationBell.tsx  # Real-time notification dropdown
│   ├── SpectatorChat.tsx     # Live chat overlay for spectators
│   └── XpBar.tsx             # XP progress bar component
├── routes/             # Pages — home, game creation, lobby, active game
│   ├── home.tsx
│   ├── games._index.tsx
│   ├── games.new.tsx
│   ├── games.$gameId.tsx
│   ├── settings.tsx    # API keys, personas, achievements, friends, crates
│   ├── daily.tsx       # Daily challenge page
│   ├── hall-of-fame.tsx # Community best-of feed
│   └── rivalries.tsx   # AI persona head-to-head records
└── lib/                # Utilities, constants, helpers
convex/
├── schema.ts           # Database schema (users, games, cards, apiKeys, customPersonas, etc.)
├── games.ts            # Game logic (mutations & queries)
├── rounds.ts           # Round management
├── ai.ts               # AI response generation & caching (Node.js actions)
├── aiQueries.ts        # AI-related queries & mutations (V8 runtime)
├── apiKeys.ts          # API key CRUD (encrypt, validate, store)
├── customPersonas.ts   # Custom persona CRUD
├── encryption.ts       # AES-256-GCM encryption utilities
├── users.ts            # User management
├── rateLimit.ts        # Rate limiting helpers
├── seed.ts             # Database seeding
├── achievements.ts     # Achievement badges system
├── dailyChallenges.ts  # Daily challenge prompts & entries
├── friends.ts          # Friends list & requests
├── hallOfFame.ts       # Hall of Fame upvoting
├── notifications.ts    # Real-time notification system
├── rewardCrates.ts     # Reward crates & unlockable card backs
├── rivalries.ts        # AI persona head-to-head tracking
├── spectatorChat.ts    # Spectator mode with live chat
└── xp.ts              # XP & leveling system
e2e/                    # Playwright test specs
```

## Setup Checklist

Use this checklist when setting up or deploying the app for the first time:

### Required

- [ ] **Node.js 20+** installed
- [ ] **Convex account** created at [convex.dev](https://convex.dev)
- [ ] **OpenAI API key** obtained at [platform.openai.com](https://platform.openai.com)
- [ ] Run `npm install`
- [ ] Create `.env` file with `VITE_CONVEX_URL=https://your-project.convex.cloud`
- [ ] Set `OPENAI_API_KEY` in the [Convex Dashboard](https://dashboard.convex.dev) environment variables
- [ ] Run `npx convex dev` to initialize Convex and generate types
- [ ] Run `npm run dev` and verify the app loads at `http://localhost:5173`
- [ ] Click "Seed Database" on the home page to populate starter card packs

### Optional (Recommended for Production)

- [ ] **Upstash Redis** — Set `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` in Convex Dashboard for rate limiting (10 AI calls/min, 100/day per game)
- [ ] **Encryption key** — Set `ENCRYPTION_KEY` in Convex Dashboard for BYOK user API key encryption (generate with `openssl rand -hex 32`)
- [ ] **Clerk authentication** — Configure Clerk for proper user auth (currently supports guest mode)

### Feature-Specific Notes

| Feature | API/Service Needed | Notes |
|---------|-------------------|-------|
| AI responses & judging | OpenAI (`OPENAI_API_KEY`) | Required — powers all AI gameplay |
| AI Voice (TTS) | None (browser Web Speech API) | Works client-side, no API key needed |
| Rate limiting | Upstash Redis | Optional — falls back to unlimited if not set |
| User API keys (BYOK) | `ENCRYPTION_KEY` | Users can bring their own OpenAI key |
| Daily Challenges | None | Uses existing OpenAI key for prompts |
| XP / Achievements / Friends | None | Purely database-driven via Convex |
| Spectator Chat | None | Real-time via Convex subscriptions |
| Hall of Fame / Rivalries | None | Database queries only |
| Reward Crates | None | Database-driven, no external service |
| Seasonal Events | None | Time-based, auto-detected from system date |
