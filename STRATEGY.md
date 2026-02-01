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
Backend:      Convex (real-time backend-as-a-service)
Database:     Convex (built-in real-time database)
Cache:        Upstash Redis (rate limiting, sessions, temporary state)
Real-time:    Convex subscriptions (built-in, no WebSocket setup needed)
AI:           OpenAI API / Anthropic Claude API / Local LLMs
Auth:         Convex Auth or Clerk
Hosting:      Vercel (frontend) + Convex Cloud (backend)
```

### Why This Stack?

**Remix v2**
- Server-first architecture with SSR and streaming
- React Router v7 with powerful nested routing
- Progressive enhancement and better error handling
- Works seamlessly with Convex on Vercel

**Convex**
- Real-time database with automatic subscriptions (no WebSocket setup!)
- TypeScript-first with end-to-end type safety
- Server functions: queries (reads), mutations (writes), actions (external APIs)
- Built-in scheduling for AI turn timeouts
- Zero configuration for real-time sync

**Upstash Redis**
- Serverless Redis (pay-per-request)
- Rate limiting for AI API calls
- Session caching and temporary game state
- Global edge deployment

**Vercel**
- Optimized for Remix deployments
- Edge functions for low latency
- Preview deployments for every PR

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel (Frontend)                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Remix v2 + React Router                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   ││
│  │  │   Game UI   │  │   Lobby     │  │   Leaderboards    │   ││
│  │  └─────────────┘  └─────────────┘  └───────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
              useQuery / useMutation (real-time)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Convex Cloud                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Queries    │  │  Mutations  │  │   Actions (AI calls)    │  │
│  │  (reads)    │  │  (writes)   │  │   (external APIs)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Convex Database (real-time sync)               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Upstash   │  │   OpenAI    │  │      Anthropic          │  │
│  │   Redis     │  │   API       │  │      Claude API         │  │
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

## Convex Database Schema

### Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users
  users: defineTable({
    clerkId: v.optional(v.string()),      // For Clerk auth
    username: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    gamesPlayed: v.number(),
    gamesWon: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  // Cards
  cards: defineTable({
    type: v.union(v.literal("prompt"), v.literal("response")),
    text: v.string(),
    packId: v.id("cardPacks"),
    isAiGenerated: v.boolean(),
  })
    .index("by_pack", ["packId"])
    .index("by_type", ["type"]),

  // Card Packs
  cardPacks: defineTable({
    name: v.string(),
    description: v.string(),
    isOfficial: v.boolean(),
    creatorId: v.optional(v.id("users")),
  })
    .index("by_creator", ["creatorId"]),

  // Games
  games: defineTable({
    status: v.union(
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("finished")
    ),
    gameMode: v.string(),
    maxPlayers: v.number(),
    pointsToWin: v.number(),
    currentRound: v.number(),
    hostId: v.id("users"),
    inviteCode: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_invite_code", ["inviteCode"])
    .index("by_host", ["hostId"]),

  // Game Players (humans and AI)
  gamePlayers: defineTable({
    gameId: v.id("games"),
    userId: v.optional(v.id("users")),     // null for AI players
    aiPersonaId: v.optional(v.string()),   // e.g., "chaotic-carl"
    isAi: v.boolean(),
    score: v.number(),
    isJudge: v.boolean(),
    hand: v.array(v.id("cards")),          // Player's current hand
  })
    .index("by_game", ["gameId"])
    .index("by_user", ["userId"]),

  // Rounds
  rounds: defineTable({
    gameId: v.id("games"),
    roundNumber: v.number(),
    promptCardId: v.id("cards"),
    judgePlayerId: v.id("gamePlayers"),
    winnerPlayerId: v.optional(v.id("gamePlayers")),
    status: v.union(
      v.literal("submitting"),
      v.literal("judging"),
      v.literal("complete")
    ),
  })
    .index("by_game", ["gameId"])
    .index("by_game_and_round", ["gameId", "roundNumber"]),

  // Submissions
  submissions: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("gamePlayers"),
    cardId: v.optional(v.id("cards")),     // null if AI-generated
    aiGeneratedText: v.optional(v.string()),
  })
    .index("by_round", ["roundId"])
    .index("by_player", ["playerId"]),
});
```

### Convex vs SQL Benefits

| Feature | Convex | Traditional SQL |
|---------|--------|-----------------|
| Real-time sync | Automatic | Manual WebSocket setup |
| Type safety | End-to-end TypeScript | Separate ORM layer |
| Indexes | Declarative | Manual migration |
| Relations | Document references | Foreign keys + JOINs |
| Scaling | Automatic | Manual configuration |

---

## Feature Roadmap

### Phase 1: MVP (Core Game Loop)

- [ ] Project setup (Remix v2 + Convex + Tailwind)
- [ ] Configure Convex schema and seed card data
- [ ] Basic UI components (cards, game board, player list)
- [ ] Convex queries for real-time game state
- [ ] Single-player vs AI mode
- [ ] Convex actions for AI response generation
- [ ] Round flow (draw prompt → AI responds → player judges)
- [ ] Simple scoring system with mutations
- [ ] Deploy to Vercel + Convex Cloud

### Phase 2: Multiplayer Foundation

- [ ] User authentication (Convex Auth or Clerk)
- [ ] Lobby system with invite codes
- [ ] Real-time game state (automatic with Convex!)
- [ ] Multiple human players support
- [ ] Rotating judge system
- [ ] Upstash Redis for rate limiting AI calls
- [ ] Game history and replays
- [ ] Scheduled functions for turn timeouts

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

## Convex Functions

Convex uses three types of functions:
- **Queries** - Read data (automatically reactive/real-time)
- **Mutations** - Write data (transactional)
- **Actions** - Call external APIs (like AI services)

### Game Functions

```typescript
// convex/games.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get game state (real-time!)
export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();
    const currentRound = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_round", (q) =>
        q.eq("gameId", gameId).eq("roundNumber", game?.currentRound ?? 0)
      )
      .first();
    return { game, players, currentRound };
  },
});

// Mutation: Create a new game
export const createGame = mutation({
  args: {
    hostId: v.id("users"),
    gameMode: v.string(),
    maxPlayers: v.number(),
    pointsToWin: v.number(),
  },
  handler: async (ctx, args) => {
    const inviteCode = generateInviteCode();
    const gameId = await ctx.db.insert("games", {
      ...args,
      status: "lobby",
      currentRound: 0,
      inviteCode,
    });
    // Add host as first player
    await ctx.db.insert("gamePlayers", {
      gameId,
      userId: args.hostId,
      isAi: false,
      score: 0,
      isJudge: false,
      hand: [],
    });
    return { gameId, inviteCode };
  },
});

// Mutation: Join a game
export const joinGame = mutation({
  args: { gameId: v.id("games"), userId: v.id("users") },
  handler: async (ctx, { gameId, userId }) => {
    const game = await ctx.db.get(gameId);
    if (game?.status !== "lobby") throw new Error("Game already started");

    await ctx.db.insert("gamePlayers", {
      gameId,
      userId,
      isAi: false,
      score: 0,
      isJudge: false,
      hand: [],
    });
  },
});

// Mutation: Submit a card
export const submitCard = mutation({
  args: {
    roundId: v.id("rounds"),
    playerId: v.id("gamePlayers"),
    cardId: v.optional(v.id("cards")),
    aiGeneratedText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("submissions", args);
  },
});

// Mutation: Select winner
export const selectWinner = mutation({
  args: { roundId: v.id("rounds"), winnerPlayerId: v.id("gamePlayers") },
  handler: async (ctx, { roundId, winnerPlayerId }) => {
    // Update round
    await ctx.db.patch(roundId, {
      winnerPlayerId,
      status: "complete",
    });
    // Update player score
    const player = await ctx.db.get(winnerPlayerId);
    if (player) {
      await ctx.db.patch(winnerPlayerId, { score: player.score + 1 });
    }
  },
});
```

### AI Functions (Actions)

```typescript
// convex/ai.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

// Action: Generate AI response
export const generateResponse = action({
  args: {
    prompt: v.string(),
    personaId: v.string(),
  },
  handler: async (ctx, { prompt, personaId }) => {
    const persona = AI_PERSONAS[personaId];
    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      temperature: persona.temperature,
      system: persona.systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "";
  },
});

// Action: AI judges submissions
export const judgeSubmissions = action({
  args: {
    promptText: v.string(),
    submissions: v.array(v.object({
      id: v.string(),
      text: v.string(),
    })),
  },
  handler: async (ctx, { promptText, submissions }) => {
    const anthropic = new Anthropic();
    // ... AI judging logic
  },
});
```

### Upstash Redis Integration

```typescript
// convex/rateLimit.ts
import { action } from "./_generated/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export const checkRateLimit = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const { success, remaining } = await ratelimit.limit(userId);
    return { allowed: success, remaining };
  },
});
```

---

## Remix + Convex Integration

### Route Structure

```
app/
├── routes/
│   ├── _index.tsx                    # Home page
│   ├── games._index.tsx              # Game list / lobby
│   ├── games.new.tsx                 # Create new game
│   ├── games.$gameId.tsx             # Game layout (real-time)
│   ├── games.$gameId._index.tsx      # Game board
│   ├── games.$gameId.lobby.tsx       # Pre-game lobby
│   └── games.$gameId.results.tsx     # Final results
├── components/
│   └── ConvexProvider.tsx            # Convex client wrapper
└── root.tsx
```

### Using Convex in Remix Components

```typescript
// app/routes/games.$gameId.tsx
import { useParams } from "@remix-run/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function GameRoute() {
  const { gameId } = useParams();

  // Real-time game state - automatically updates!
  const gameState = useQuery(api.games.getGame, {
    gameId: gameId as Id<"games">,
  });

  // Mutations
  const submitCard = useMutation(api.games.submitCard);
  const selectWinner = useMutation(api.games.selectWinner);

  if (!gameState) return <div>Loading...</div>;

  const handleSubmit = async (cardId: Id<"cards">) => {
    await submitCard({
      roundId: gameState.currentRound!._id,
      playerId: currentPlayerId,
      cardId,
    });
  };

  return (
    <div>
      <h1>Game: {gameState.game?.status}</h1>
      <PlayerList players={gameState.players} />
      <GameBoard
        round={gameState.currentRound}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

### Convex Provider Setup

```typescript
// app/root.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.CONVEX_URL!);

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <Outlet />
    </ConvexProvider>
  );
}
```

---

## Real-time with Convex

### No WebSocket Setup Required!

Convex handles real-time automatically. When you use `useQuery`, the component re-renders whenever the data changes - across all connected clients.

```typescript
// This automatically updates in real-time for ALL players
const gameState = useQuery(api.games.getGame, { gameId });

// When any player submits a card, everyone sees it instantly
const submissions = useQuery(api.rounds.getSubmissions, { roundId });
```

### Real-time Game Events

| Event | How it Works |
|-------|--------------|
| Player joined | Query `gamePlayers` table updates |
| Card submitted | Query `submissions` table updates |
| Round started | Query `rounds` table updates |
| Winner selected | Query updates score + round status |
| Game ended | Query `games` status changes |

### Scheduled Functions (Turn Timeouts)

```typescript
// convex/rounds.ts
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const startRound = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const roundId = await ctx.db.insert("rounds", { /* ... */ });

    // Schedule auto-timeout after 60 seconds
    await ctx.scheduler.runAfter(
      60000,
      internal.rounds.autoTimeout,
      { roundId }
    );

    return roundId;
  },
});

export const autoTimeout = internalMutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (round?.status === "submitting") {
      // Auto-submit for players who didn't respond
      await ctx.db.patch(roundId, { status: "judging" });
    }
  },
});
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

- Rate limit AI API calls with Upstash Redis
- Sanitize user-generated content in Convex mutations
- Implement content moderation for custom cards
- Convex handles auth and data access rules
- All game logic runs server-side in Convex (no cheating)
- Use Convex argument validation (`v.string()`, etc.)
- Environment variables stored securely in Convex dashboard

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
   cd ai-against-humanity
   ```

2. Set up Tailwind CSS
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. Initialize Convex
   ```bash
   npm install convex
   npx convex dev  # Creates convex/ folder and starts dev server
   ```

4. Set up Upstash Redis
   ```bash
   npm install @upstash/redis @upstash/ratelimit
   # Add UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN to .env
   ```

5. Install AI SDK
   ```bash
   npm install @anthropic-ai/sdk openai
   # Add ANTHROPIC_API_KEY to Convex environment variables
   ```

6. Create Convex schema and seed data
7. Build UI components with real-time Convex queries
8. Implement single-player mode against one AI
9. Deploy: `vercel` + `npx convex deploy`

### Project Structure

```
ai-against-humanity/
├── app/
│   ├── components/       # Reusable UI components
│   │   ├── Card.tsx
│   │   ├── GameBoard.tsx
│   │   ├── PlayerList.tsx
│   │   └── ScoreBoard.tsx
│   ├── routes/           # Remix routes (pages)
│   │   ├── _index.tsx
│   │   ├── games._index.tsx
│   │   └── games.$gameId.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── useGameState.ts
│   ├── root.tsx          # App shell + ConvexProvider
│   └── entry.*.tsx       # Remix entry points
├── convex/               # Convex backend
│   ├── _generated/       # Auto-generated types
│   ├── schema.ts         # Database schema
│   ├── games.ts          # Game queries/mutations
│   ├── rounds.ts         # Round logic
│   ├── ai.ts             # AI actions
│   └── rateLimit.ts      # Upstash rate limiting
├── public/               # Static assets
├── .env                  # Local env vars
└── package.json
```

### Environment Variables

```bash
# .env.local (Remix/Vercel)
CONVEX_URL=https://your-project.convex.cloud

# Convex Dashboard (for actions)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
```

### Deployment

```bash
# Deploy Convex backend
npx convex deploy

# Deploy Remix to Vercel
vercel

# Or connect GitHub repo for auto-deploys
```

---

## Conclusion

AI Against Humanity combines the beloved party game format with the creativity of modern AI models. The phased approach allows for rapid MVP development while building toward a feature-rich multiplayer experience. The AI personas add replayability and entertainment value beyond traditional card games.

**Let's build something hilarious.** 🎴🤖
