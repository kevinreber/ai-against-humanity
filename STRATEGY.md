# AI Against Humanity - Strategy Plan

## Overview

**AI Against Humanity** is a multiplayer card game inspired by Cards Against Humanity, where AI models compete to create the funniest, most creative, or most absurd responses to prompts. Players can watch AI models battle each other, vote on winners, or compete alongside AI opponents.

---

## Game Concept

### Core Mechanics

1. **Prompt Cards (Black Cards)**: Questions or fill-in-the-blank statements
2. **Response Cards (White Cards)**: AI-generated or pre-written answers
3. **Judging System**: Human players, AI judges, or crowd voting determine winners
4. **Scoring**: Points awarded per round, first to threshold wins

### Game Modes

| Mode | Description |
|------|-------------|
| **AI Battle Royale** | Multiple AI models compete against each other |
| **Human vs AI** | Players compete against AI opponents |
| **AI Judge** | AI evaluates human player responses |
| **Collaborative** | Human + AI team vs other teams |
| **Spectator** | Watch AI models battle, vote on favorites |

---

## Technical Architecture

### Tech Stack Recommendation

```
Frontend:     Remix v2 + React Router + TypeScript + Tailwind CSS
Backend:      Remix Loaders/Actions + Node.js
Database:     PostgreSQL (game data) + Redis (real-time state)
Real-time:    Socket.io or WebSockets
AI:           OpenAI API / Anthropic Claude API / Local LLMs
Auth:         remix-auth or Clerk
Hosting:      Fly.io / Railway / Render (full-stack)
```

### Why Remix v2?

- **Server-first architecture** - Better performance with SSR and streaming
- **Built-in data loading** - Loaders and actions eliminate client-side fetch boilerplate
- **React Router v7** - Powerful nested routing with data co-location
- **Progressive enhancement** - Works without JavaScript, enhances with it
- **Better error handling** - Error boundaries at route level
- **Form handling** - Native form submissions with progressive enhancement

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Game UI   │  │   Lobby     │  │   Leaderboards/Stats    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Game API   │  │  AI Service │  │   WebSocket Server      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL  │  │    Redis    │  │   AI Model Providers    │  │
│  │ (Persistent)│  │ (Real-time) │  │ (OpenAI/Anthropic/etc)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Integration Strategy

### AI Personas

Create distinct AI "players" with unique personalities:

| Persona | Style | Temperature |
|---------|-------|-------------|
| **Chaotic Carl** | Absurd, random, unexpected | 1.2 |
| **Sophisticated Sophie** | Witty, intellectual humor | 0.7 |
| **Edgy Eddie** | Dark humor, boundary-pushing | 0.9 |
| **Wholesome Wendy** | Clean, family-friendly | 0.5 |
| **Literal Larry** | Misses the joke, accidentally funny | 0.3 |

### AI Response Generation

```typescript
interface AIPlayer {
  id: string;
  name: string;
  personality: string;
  systemPrompt: string;
  temperature: number;
  model: 'gpt-4' | 'claude-3' | 'llama-3';
}

// Example system prompt
const chaoticCarl = {
  name: "Chaotic Carl",
  systemPrompt: `You are playing a Cards Against Humanity style game.
    Your personality is chaotic and absurd. Give unexpected,
    surreal answers that subvert expectations. Be creative and weird.
    Respond with ONLY your card answer, nothing else.`
};
```

### AI Judging System

For AI-judged rounds:
- Analyze humor patterns (subversion, timing, absurdity)
- Score based on relevance, creativity, and shock value
- Provide optional "judge commentary" explaining the choice

---

## Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cards
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  type ENUM('prompt', 'response'),
  text TEXT NOT NULL,
  pack_id UUID REFERENCES card_packs(id),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Card Packs
CREATE TABLE card_packs (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  is_official BOOLEAN DEFAULT FALSE,
  creator_id UUID REFERENCES users(id)
);

-- Games
CREATE TABLE games (
  id UUID PRIMARY KEY,
  status ENUM('lobby', 'playing', 'finished'),
  game_mode VARCHAR(50),
  max_players INT DEFAULT 8,
  points_to_win INT DEFAULT 10,
  current_round INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game Players (humans and AI)
CREATE TABLE game_players (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  user_id UUID REFERENCES users(id) NULL,
  ai_persona_id VARCHAR(50) NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  score INT DEFAULT 0,
  is_judge BOOLEAN DEFAULT FALSE
);

-- Rounds
CREATE TABLE rounds (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  round_number INT,
  prompt_card_id UUID REFERENCES cards(id),
  judge_player_id UUID REFERENCES game_players(id),
  winner_player_id UUID REFERENCES game_players(id),
  status ENUM('submitting', 'judging', 'complete')
);

-- Submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  round_id UUID REFERENCES rounds(id),
  player_id UUID REFERENCES game_players(id),
  card_id UUID REFERENCES cards(id) NULL,
  ai_generated_text TEXT NULL,
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

---

## Feature Roadmap

### Phase 1: MVP (Core Game Loop)

- [ ] Project setup (Remix v2, TypeScript, Tailwind)
- [ ] Basic UI components (cards, game board, player list)
- [ ] Card database with seed data
- [ ] Remix loaders for data fetching
- [ ] Single-player vs AI mode
- [ ] Basic AI response generation
- [ ] Round flow (draw prompt → AI responds → player judges)
- [ ] Simple scoring system

### Phase 2: Multiplayer Foundation

- [ ] User authentication (remix-auth with OAuth providers)
- [ ] Session management with Remix cookie sessions
- [ ] Lobby system (create/join games) with loaders/actions
- [ ] Custom Express server with Socket.io integration
- [ ] Real-time game state synchronization
- [ ] Multiple human players support
- [ ] Rotating judge system
- [ ] Game history and replays

### Phase 3: AI Enhancement

- [ ] Multiple AI personas
- [ ] AI difficulty levels
- [ ] AI judge mode
- [ ] AI-generated cards (expand deck dynamically)
- [ ] Response quality tuning

### Phase 4: Social Features

- [ ] Friend system
- [ ] Private games with invite codes
- [ ] Global leaderboards
- [ ] Achievement system
- [ ] Share memorable rounds to social media

### Phase 5: Content & Polish

- [ ] Multiple card packs (themed decks)
- [ ] User-created card packs
- [ ] Custom AI persona creation
- [ ] Tournament mode
- [ ] Spectator mode with live voting
- [ ] Mobile-responsive design

---

## Remix Routes & API

### Route Structure

```
app/
├── routes/
│   ├── _index.tsx                    # Home page
│   ├── games._index.tsx              # Game list / lobby
│   ├── games.new.tsx                 # Create new game
│   ├── games.$gameId.tsx             # Game layout
│   ├── games.$gameId._index.tsx      # Game board
│   ├── games.$gameId.lobby.tsx       # Pre-game lobby
│   ├── games.$gameId.results.tsx     # Final results
│   ├── api.ai.generate.tsx           # AI response generation
│   ├── api.ai.judge.tsx              # AI judging
│   └── api.ai.card.tsx               # AI card generation
```

### Loader/Action Pattern

```typescript
// app/routes/games.$gameId.tsx
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";

// GET - Load game state
export async function loader({ params }: LoaderFunctionArgs) {
  const game = await getGame(params.gameId);
  return json({ game });
}

// POST/PUT/DELETE - Handle game actions
export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "join":
      return joinGame(params.gameId, formData);
    case "submit":
      return submitCard(params.gameId, formData);
    case "judge":
      return selectWinner(params.gameId, formData);
    default:
      throw new Response("Invalid action", { status: 400 });
  }
}

export default function GameRoute() {
  const { game } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="submit" />
      {/* Game UI */}
    </fetcher.Form>
  );
}
```

### Resource Routes (API-only)

```typescript
// app/routes/api.ai.generate.tsx
export async function action({ request }: ActionFunctionArgs) {
  const { prompt, persona } = await request.json();
  const response = await generateAIResponse(prompt, persona);
  return json({ response });
}
```

### Game Management Actions

| Route | Loader (GET) | Action (POST) |
|-------|--------------|---------------|
| `/games` | List games | Create game |
| `/games/:id` | Game state | Join/Leave/Start |
| `/games/:id/lobby` | Lobby state | Update settings |
| `/games/:id` | Round state | Submit/Judge |

### AI Resource Routes

| Route | Action |
|-------|--------|
| `/api/ai/generate` | Generate AI response |
| `/api/ai/judge` | AI judges submissions |
| `/api/ai/card` | Generate new card |

### Cards & Packs

| Route | Loader | Action |
|-------|--------|--------|
| `/cards` | List cards | - |
| `/packs` | List packs | Create pack |
| `/packs/:id` | Pack details | Update pack |

---

## Real-time with WebSockets

### Remix + Socket.io Setup

Since Remix doesn't have built-in WebSocket support, we'll run Socket.io alongside the Remix server:

```typescript
// server.ts (custom Express server)
import { createRequestHandler } from "@remix-run/express";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Socket.io handling
io.on("connection", (socket) => {
  socket.on("join-game", ({ gameId, playerId }) => {
    socket.join(`game:${gameId}`);
    io.to(`game:${gameId}`).emit("player-joined", { playerId });
  });
  // ... more events
});

// Remix request handler
app.all("*", createRequestHandler({ build: require("./build") }));

httpServer.listen(3000);
```

### Client → Server Events

```typescript
socket.emit('join-game', { gameId, playerId });
socket.emit('submit-card', { roundId, cardId });
socket.emit('select-winner', { roundId, submissionId });
socket.emit('chat-message', { gameId, message });
```

### Server → Client Events

```typescript
socket.on('player-joined', { player });
socket.on('round-started', { round, promptCard });
socket.on('submission-received', { playerId }); // anonymous until reveal
socket.on('all-submitted', { submissions }); // reveal phase
socket.on('winner-selected', { winner, scores });
socket.on('game-ended', { finalScores, winner });
```

### React Hook for Socket.io

```typescript
// app/hooks/useSocket.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(gameId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io({ path: "/ws" });
    newSocket.emit("join-game", { gameId });
    setSocket(newSocket);

    return () => { newSocket.close(); };
  }, [gameId]);

  return socket;
}
```

---

## UI/UX Design Principles

### Visual Style

- **Dark theme** with neon accents (cyberpunk aesthetic fits AI theme)
- **Card animations** for dealing, flipping, selecting
- **AI typing indicators** to simulate AI "thinking"
- **Particle effects** for winning moments

### Key Screens

1. **Home/Landing** - Game modes, quick play, create game
2. **Lobby** - Player list, settings, AI opponent selection
3. **Game Board** - Prompt card, hand, submissions, scoreboard
4. **Judging View** - Anonymous submissions, voting interface
5. **Results** - Round winner, running scores, reaction buttons
6. **End Game** - Final standings, memorable moments, rematch

---

## Monetization Options (Future)

| Option | Description |
|--------|-------------|
| **Premium Packs** | Exclusive themed card packs |
| **Custom AI Personas** | Create/save custom AI personalities |
| **Ad-Free** | Remove ads for premium users |
| **Tournament Entry** | Entry fees for prize tournaments |

---

## Security Considerations

- Rate limit AI API calls to prevent abuse
- Sanitize user-generated content
- Implement content moderation for custom cards
- Secure WebSocket connections
- Validate all game actions server-side
- Implement anti-cheat measures

---

## Success Metrics

- **DAU/MAU** - Daily/Monthly active users
- **Games per user** - Engagement depth
- **Session length** - Time spent playing
- **AI rating** - User ratings of AI responses
- **Viral coefficient** - Social shares per game

---

## Getting Started

### Recommended First Steps

1. Initialize Remix v2 project with TypeScript
   ```bash
   npx create-remix@latest ai-against-humanity
   ```
2. Set up Tailwind CSS and component library
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
3. Configure database (Prisma + PostgreSQL recommended)
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```
4. Create card component and basic game board UI
5. Set up loaders/actions for game state management
6. Implement single-player mode against one AI
7. Add AI response generation with OpenAI/Claude
8. Build the core game loop with Remix forms
9. Iterate and expand from there

### Project Structure

```
ai-against-humanity/
├── app/
│   ├── components/       # Reusable UI components
│   │   ├── Card.tsx
│   │   ├── GameBoard.tsx
│   │   ├── PlayerList.tsx
│   │   └── ScoreBoard.tsx
│   ├── routes/           # Remix routes (pages + API)
│   ├── services/         # Business logic
│   │   ├── ai.server.ts  # AI integration
│   │   ├── game.server.ts
│   │   └── auth.server.ts
│   ├── utils/            # Helpers
│   ├── root.tsx          # App shell
│   └── entry.*.tsx       # Remix entry points
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── package.json
```

---

## Conclusion

AI Against Humanity combines the beloved party game format with the creativity of modern AI models. The phased approach allows for rapid MVP development while building toward a feature-rich multiplayer experience. The AI personas add replayability and entertainment value beyond traditional card games.

**Let's build something hilarious.** 🎴🤖
