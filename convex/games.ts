import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { MAX_AI_PLAYERS_PER_GAME, MAX_AI_PLAYERS_WITH_OWN_KEY } from "./gameConstants";

// Generate a random 6-character invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Query: Get game state (real-time!)
export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;

    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    const currentRound = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_round", (q) =>
        q.eq("gameId", gameId).eq("roundNumber", game.currentRound)
      )
      .first();

    let promptCard = null;
    if (currentRound) {
      promptCard = await ctx.db.get(currentRound.promptCardId);
    }

    return { game, players, currentRound, promptCard };
  },
});

// Query: Get game by invite code
export const getGameByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();
    return game;
  },
});

// Query: List all games in lobby status
export const listLobbies = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "lobby"))
      .collect();

    // Get player counts for each game
    const gamesWithCounts = await Promise.all(
      games.map(async (game) => {
        const players = await ctx.db
          .query("gamePlayers")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
        return { ...game, playerCount: players.length };
      })
    );

    return gamesWithCounts;
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
    if (!game) throw new Error("Game not found");
    if (game.status !== "lobby") throw new Error("Game already started");

    // Check if already in game
    const existingPlayer = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingPlayer) throw new Error("Already in this game");

    // Check max players
    const currentPlayers = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    if (currentPlayers.length >= game.maxPlayers) {
      throw new Error("Game is full");
    }

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

// Mutation: Add AI player to game (capped to limit API costs)
export const addAiPlayer = mutation({
  args: { gameId: v.id("games"), aiPersonaId: v.string() },
  handler: async (ctx, { gameId, aiPersonaId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "lobby") throw new Error("Game already started");

    // Check if host has their own API key — allows higher AI player cap
    const hostApiKey = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", game.hostId).eq("provider", "openai")
      )
      .first();

    const maxAi = hostApiKey?.isValid
      ? MAX_AI_PLAYERS_WITH_OWN_KEY
      : MAX_AI_PLAYERS_PER_GAME;

    // Enforce AI player cap to control API costs
    const existingPlayers = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    const aiPlayerCount = existingPlayers.filter((p) => p.isAi).length;
    if (aiPlayerCount >= maxAi) {
      throw new Error(`Maximum of ${maxAi} AI players per game`);
    }

    await ctx.db.insert("gamePlayers", {
      gameId,
      aiPersonaId,
      isAi: true,
      score: 0,
      isJudge: false,
      hand: [],
    });
  },
});

// Mutation: Start the game
export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "lobby") throw new Error("Game already started");

    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    if (players.length < 2) throw new Error("Need at least 2 players");

    // Set first player as judge
    await ctx.db.patch(players[0]._id, { isJudge: true });

    // Update game status
    await ctx.db.patch(gameId, { status: "playing", currentRound: 1 });

    // Get a random prompt card
    const promptCards = await ctx.db
      .query("cards")
      .withIndex("by_type", (q) => q.eq("type", "prompt"))
      .collect();

    if (promptCards.length === 0) throw new Error("No prompt cards available");
    const randomPrompt =
      promptCards[Math.floor(Math.random() * promptCards.length)];

    // Create first round
    const roundId = await ctx.db.insert("rounds", {
      gameId,
      roundNumber: 1,
      promptCardId: randomPrompt._id,
      judgePlayerId: players[0]._id,
      status: "submitting",
    });

    // Schedule server-side AI response generation
    await ctx.scheduler.runAfter(0, internal.ai.generateAiSubmissions, {
      gameId,
      roundId,
    });

    // Deal cards to non-judge players
    const responseCards = await ctx.db
      .query("cards")
      .withIndex("by_type", (q) => q.eq("type", "response"))
      .collect();

    const shuffled = [...responseCards].sort(() => Math.random() - 0.5);
    let cardIndex = 0;

    for (const player of players) {
      if (!player.isJudge) {
        const hand = shuffled.slice(cardIndex, cardIndex + 7).map((c) => c._id);
        await ctx.db.patch(player._id, { hand });
        cardIndex += 7;
      }
    }
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
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");
    if (round.status !== "submitting") throw new Error("Round not accepting submissions");

    // Check for existing submission
    const existingSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    if (existingSubmission) throw new Error("Already submitted");

    await ctx.db.insert("submissions", {
      roundId: args.roundId,
      playerId: args.playerId,
      cardId: args.cardId,
      aiGeneratedText: args.aiGeneratedText,
    });

    // Remove card from player's hand if it was a card submission
    if (args.cardId) {
      const player = await ctx.db.get(args.playerId);
      if (player) {
        const newHand = player.hand.filter((id) => id !== args.cardId);
        await ctx.db.patch(args.playerId, { hand: newHand });
      }
    }
  },
});

// Mutation: Select winner
export const selectWinner = mutation({
  args: { roundId: v.id("rounds"), winnerPlayerId: v.id("gamePlayers") },
  handler: async (ctx, { roundId, winnerPlayerId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) throw new Error("Round not found");

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

    // Check if game is over
    const game = await ctx.db.get(round.gameId);
    if (game && player && player.score + 1 >= game.pointsToWin) {
      await ctx.db.patch(round.gameId, { status: "finished" });
      // Update user stats
      if (player.userId) {
        const user = await ctx.db.get(player.userId);
        if (user) {
          await ctx.db.patch(player.userId, { gamesWon: user.gamesWon + 1 });
        }
      }
    }
  },
});

// Mutation: Start next round
export const startNextRound = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "playing") throw new Error("Game not in progress");

    const newRoundNumber = game.currentRound + 1;

    // Get all players and rotate judge
    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    const currentJudgeIndex = players.findIndex((p) => p.isJudge);
    const nextJudgeIndex = (currentJudgeIndex + 1) % players.length;

    // Update judge status
    for (let i = 0; i < players.length; i++) {
      await ctx.db.patch(players[i]._id, { isJudge: i === nextJudgeIndex });
    }

    // Get a random prompt card
    const promptCards = await ctx.db
      .query("cards")
      .withIndex("by_type", (q) => q.eq("type", "prompt"))
      .collect();

    const randomPrompt =
      promptCards[Math.floor(Math.random() * promptCards.length)];

    // Update game round
    await ctx.db.patch(gameId, { currentRound: newRoundNumber });

    // Create new round
    const roundId = await ctx.db.insert("rounds", {
      gameId,
      roundNumber: newRoundNumber,
      promptCardId: randomPrompt._id,
      judgePlayerId: players[nextJudgeIndex]._id,
      status: "submitting",
    });

    // Schedule server-side AI response generation
    await ctx.scheduler.runAfter(0, internal.ai.generateAiSubmissions, {
      gameId,
      roundId,
    });
  },
});
