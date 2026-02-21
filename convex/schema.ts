import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users
  users: defineTable({
    clerkId: v.optional(v.string()),
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
  }).index("by_creator", ["creatorId"]),

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
    userId: v.optional(v.id("users")),
    aiPersonaId: v.optional(v.string()),
    isAi: v.boolean(),
    score: v.number(),
    isJudge: v.boolean(),
    hand: v.array(v.id("cards")),
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
    cardId: v.optional(v.id("cards")),
    aiGeneratedText: v.optional(v.string()),
  })
    .index("by_round", ["roundId"])
    .index("by_player", ["playerId"]),

  // AI Response Cache - stores pools of responses per prompt+persona to avoid repeated API calls
  aiResponseCache: defineTable({
    promptText: v.string(),
    personaId: v.string(),
    responses: v.array(v.string()),
  }).index("by_prompt_persona", ["promptText", "personaId"]),
});
