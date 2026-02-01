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
Frontend:     React/Next.js + TypeScript + Tailwind CSS
Backend:      Node.js + Express or Next.js API Routes
Database:     PostgreSQL (game data) + Redis (real-time state)
Real-time:    Socket.io or WebSockets
AI:           OpenAI API / Anthropic Claude API / Local LLMs
Auth:         NextAuth.js or Clerk
Hosting:      Vercel (frontend) + Railway/Fly.io (backend)
```

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

- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] Basic UI components (cards, game board, player list)
- [ ] Card database with seed data
- [ ] Single-player vs AI mode
- [ ] Basic AI response generation
- [ ] Round flow (draw prompt → AI responds → player judges)
- [ ] Simple scoring system

### Phase 2: Multiplayer Foundation

- [ ] User authentication
- [ ] Lobby system (create/join games)
- [ ] Real-time game state with WebSockets
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

## API Endpoints

### Game Management

```
POST   /api/games              - Create new game
GET    /api/games/:id          - Get game state
POST   /api/games/:id/join     - Join a game
POST   /api/games/:id/start    - Start the game
DELETE /api/games/:id/leave    - Leave a game
```

### Gameplay

```
GET    /api/games/:id/round         - Get current round
POST   /api/games/:id/submit        - Submit a response
POST   /api/games/:id/judge         - Judge picks winner
GET    /api/games/:id/results       - Get final results
```

### AI Services

```
POST   /api/ai/generate-response    - Generate AI response
POST   /api/ai/judge-responses      - AI judges submissions
POST   /api/ai/generate-card        - Generate new card
```

### Cards & Packs

```
GET    /api/cards                   - List cards
GET    /api/packs                   - List card packs
POST   /api/packs                   - Create custom pack
```

---

## WebSocket Events

### Client → Server

```typescript
socket.emit('join-game', { gameId, playerId });
socket.emit('submit-card', { roundId, cardId });
socket.emit('select-winner', { roundId, submissionId });
socket.emit('chat-message', { gameId, message });
```

### Server → Client

```typescript
socket.on('player-joined', { player });
socket.on('round-started', { round, promptCard });
socket.on('submission-received', { playerId }); // anonymous until reveal
socket.on('all-submitted', { submissions }); // reveal phase
socket.on('winner-selected', { winner, scores });
socket.on('game-ended', { finalScores, winner });
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

1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS and component library
3. Create card component and basic game board UI
4. Implement single-player mode against one AI
5. Add AI response generation with OpenAI/Claude
6. Build the core game loop
7. Iterate and expand from there

---

## Conclusion

AI Against Humanity combines the beloved party game format with the creativity of modern AI models. The phased approach allows for rapid MVP development while building toward a feature-rich multiplayer experience. The AI personas add replayability and entertainment value beyond traditional card games.

**Let's build something hilarious.** 🎴🤖
