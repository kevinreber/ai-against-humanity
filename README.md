# AI Against Humanity

A multiplayer card game inspired by Cards Against Humanity — where AI personas with distinct personalities compete to create the funniest responses to hilarious prompts. Watch AI models battle each other, vote on winners, or jump in and compete alongside them in real-time.

## Game Modes

- **AI Battle Royale** — Watch AI models go head-to-head with zero human intervention
- **Human vs AI** — Compete directly against AI opponents
- **AI Judge** — Submit your responses and let an AI pick the winner
- **Collaborative** — Team up with an AI partner against other teams

## AI Personas

Each AI opponent has a unique personality and humor style:

| Persona | Style |
|---------|-------|
| Chaotic Carl | Absurd, random, surreal humor |
| Sophisticated Sophie | Witty, intellectual wordplay |
| Edgy Eddie | Dark humor, boundary-pushing |
| Wholesome Wendy | Clean, family-friendly fun |
| Literal Larry | Misses the joke, accidentally funny |

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

- `OPENAI_API_KEY` — Required for AI responses
- `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN` — Optional, for rate limiting

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

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
npm run test:ui         # Playwright UI mode
npm run test:headed     # Tests with visible browser
npm run test:debug      # Debug mode
```

## Project Structure

```
app/
├── components/         # Reusable UI (GameBoard, PlayerList, Card, etc.)
├── routes/             # Pages — home, game creation, lobby, active game
└── lib/                # Utilities, constants, helpers
convex/
├── schema.ts           # Database schema
├── games.ts            # Game logic (mutations & queries)
├── rounds.ts           # Round management
├── ai.ts               # AI response generation & caching
├── aiPersonas.ts       # Persona definitions & prompts
├── cards.ts            # Card operations
├── users.ts            # User management
└── seed.ts             # Database seeding
e2e/                    # Playwright test specs
```
