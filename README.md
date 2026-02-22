# AI Against Humanity

A multiplayer card game where AI models compete with humans to create the funniest responses. Built with React Router, Convex, and OpenAI.

## Features

- **Multiplayer gameplay** — Humans and AI compete in real-time
- **5 built-in AI personas** — Each with unique humor styles and personalities
- **Custom AI personas** — Create your own AI personalities with custom behavior
- **Bring Your Own Key (BYOK)** — Use your own OpenAI API key for more AI players and no rate limits
- **Real-time sync** — Powered by Convex for instant game state updates
- **AI judging** — Let AI pick the funniest response
- **Response caching** — Reduces API costs by reusing responses for repeated prompts
- **Rate limiting** — Upstash Redis-based sliding window to prevent cost overruns

## Tech Stack

- **Frontend**: React 19, React Router 7 (SSR), TailwindCSS 4
- **Backend**: Convex (real-time database + server functions)
- **AI**: OpenAI API (gpt-4o-mini)
- **Rate Limiting**: Upstash Redis
- **Deployment**: Vercel (frontend) + Convex Cloud (backend)

## Getting Started

### Prerequisites

- Node.js 20+
- A [Convex](https://convex.dev) account
- An [OpenAI](https://platform.openai.com) API key

### Installation

```bash
npm install
```

### Environment Setup

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Set `VITE_CONVEX_URL` in `.env` to your Convex deployment URL.

3. In the **Convex Dashboard**, set these environment variables:

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

Your application will be available at `http://localhost:5173`.

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

## Built-in AI Personas

| Persona | Style | Creativity |
|---------|-------|------------|
| Chaotic Carl | Absurd, random, unexpected | 1.0 (High) |
| Sophisticated Sophie | Witty, intellectual wordplay | 0.7 (Medium) |
| Edgy Eddie | Dark humor, boundary-pushing | 0.9 (High) |
| Wholesome Wendy | Clean, family-friendly | 0.5 (Medium) |
| Literal Larry | Misses the joke, accidentally funny | 0.3 (Low) |

## Game Modes

- **AI Battle Royale** — Watch AI models compete against each other
- **Human vs AI** — Compete against AI opponents
- **AI Judge** — AI evaluates your responses
- **Collaborative** — Team up with AI against others

## Project Structure

```
app/
  routes/
    home.tsx              # Landing page
    games._index.tsx      # Game lobby list
    games.new.tsx         # Create game (with custom persona selection)
    games.$gameId.tsx     # Active game page
    settings.tsx          # API keys + custom persona management
  components/
    GameBoard.tsx         # Main game UI
    PlayerList.tsx        # Player list (supports custom persona names)
    ScoreBoard.tsx        # Scores and results
    Card.tsx              # Card component
  lib/
    constants.ts          # Persona metadata, game modes, defaults

convex/
  schema.ts              # Database schema (users, games, cards, apiKeys, customPersonas)
  ai.ts                  # AI generation + judging (BYOK support)
  apiKeys.ts             # API key CRUD (encrypt, validate, store)
  customPersonas.ts      # Custom persona CRUD
  encryption.ts          # AES-256-GCM encryption utilities
  games.ts               # Game lifecycle mutations
  rounds.ts              # Round management
  users.ts               # User management
  rateLimit.ts           # Rate limiting helpers
  seed.ts                # Database seeding
```

## Building for Production

```bash
npm run build
```

### Docker

```bash
docker build -t ai-against-humanity .
docker run -p 3000:3000 ai-against-humanity
```

## Testing

```bash
npm run test          # Run e2e tests
npm run test:headed   # Run with browser visible
npm run test:debug    # Debug mode
```

---

Built with React Router, Convex, and AI.
