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
    // Feature 9: Player Avatars & Titles
    avatar: v.optional(v.string()), // emoji avatar
    title: v.optional(v.string()), // earned title
    // XP / Leveling System
    xp: v.optional(v.number()),
    level: v.optional(v.number()),
    // Daily Challenge tracking
    lastDailyChallengeDate: v.optional(v.string()), // "YYYY-MM-DD"
    dailyChallengeStreak: v.optional(v.number()),
    dailyChallengesCompleted: v.optional(v.number()),
    // Unlockables
    unlockedCardBacks: v.optional(v.array(v.string())),
    selectedCardBack: v.optional(v.string()),
    // AI personas beaten (for achievement tracking)
    aiPersonasBeaten: v.optional(v.array(v.string())),
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
    // Feature 10: Voice / TTS Mode
    ttsEnabled: v.optional(v.boolean()),
    // Spectator mode
    allowSpectators: v.optional(v.boolean()),
    // Seasonal event tag
    seasonalEvent: v.optional(v.string()),
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
    // Feature 3: Streak tracking
    streak: v.optional(v.number()),
    // Spectator flag
    isSpectator: v.optional(v.boolean()),
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
    // Feature 6: Themed Rounds
    themeModifier: v.optional(v.string()),
    // Feature 2: AI Roast Commentary
    roastCommentary: v.optional(v.string()),
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

  // Feature 1: Audience Votes
  audienceVotes: defineTable({
    roundId: v.id("rounds"),
    oderId: v.id("users"),
    submissionId: v.id("submissions"),
  })
    .index("by_round", ["roundId"])
    .index("by_round_and_voter", ["roundId", "oderId"]),

  // Feature 7: Round Highlights (saved best rounds for sharing)
  roundHighlights: defineTable({
    gameId: v.id("games"),
    roundId: v.id("rounds"),
    savedBy: v.id("users"),
    promptText: v.string(),
    winningResponse: v.string(),
    winnerName: v.string(),
    roastCommentary: v.optional(v.string()),
    savedAt: v.number(),
    // Hall of Fame fields
    upvotes: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
  })
    .index("by_user", ["savedBy"])
    .index("by_game", ["gameId"]),

  // AI Response Cache - stores pools of responses per prompt+persona to avoid repeated API calls
  aiResponseCache: defineTable({
    promptText: v.string(),
    personaId: v.string(),
    responses: v.array(v.string()),
  }).index("by_prompt_persona", ["promptText", "personaId"]),

  // User API Keys - encrypted storage for user-provided API credentials
  userApiKeys: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    encryptedKey: v.string(),
    keyHint: v.string(), // last 4 chars for display, e.g. "...7xQ2"
    isValid: v.boolean(),
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
    lastError: v.optional(v.string()),
    lastErrorAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_provider", ["userId", "provider"]),

  // Custom AI Personas - user-created AI personalities
  customPersonas: defineTable({
    creatorId: v.id("users"),
    name: v.string(),
    personality: v.string(), // short description
    systemPrompt: v.string(),
    temperature: v.number(),
    emoji: v.string(),
    isPublic: v.boolean(),
    // Feature 5: Persona Marketplace - install count
    installCount: v.optional(v.number()),
  })
    .index("by_creator", ["creatorId"])
    .index("by_public", ["isPublic"]),

  // Daily Challenges
  dailyChallenges: defineTable({
    date: v.string(), // "YYYY-MM-DD"
    promptText: v.string(),
    themeModifier: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_date", ["date"]),

  // Daily Challenge Entries
  dailyChallengeEntries: defineTable({
    challengeId: v.id("dailyChallenges"),
    userId: v.id("users"),
    response: v.string(),
    votes: v.optional(v.number()),
    submittedAt: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_and_user", ["challengeId", "userId"]),

  // Daily Challenge Votes
  dailyChallengeVotes: defineTable({
    challengeId: v.id("dailyChallenges"),
    voterId: v.id("users"),
    entryId: v.id("dailyChallengeEntries"),
  })
    .index("by_challenge_and_voter", ["challengeId", "voterId"]),

  // Achievements
  achievements: defineTable({
    userId: v.id("users"),
    achievementId: v.string(),
    unlockedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_achievement", ["userId", "achievementId"]),

  // Friends
  friends: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_user_and_friend", ["userId", "friendId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "friend_request", "game_invite", "achievement", "daily_challenge", etc.
    message: v.string(),
    data: v.optional(v.string()), // JSON-encoded extra data
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Spectator Chat Messages
  spectatorChat: defineTable({
    gameId: v.id("games"),
    userId: v.id("users"),
    username: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_game", ["gameId"]),

  // AI Persona Rivalries - head-to-head tracking
  personaRivalries: defineTable({
    persona1Id: v.string(),
    persona2Id: v.string(),
    persona1Wins: v.number(),
    persona2Wins: v.number(),
    totalGames: v.number(),
    lastGameAt: v.number(),
  }).index("by_matchup", ["persona1Id", "persona2Id"]),

  // Hall of Fame Upvotes
  hallOfFameVotes: defineTable({
    highlightId: v.id("roundHighlights"),
    userId: v.id("users"),
  })
    .index("by_highlight", ["highlightId"])
    .index("by_highlight_and_user", ["highlightId", "userId"]),

  // Reward Crates
  rewardCrates: defineTable({
    userId: v.id("users"),
    crateType: v.string(), // "bronze", "silver", "gold", "diamond"
    opened: v.boolean(),
    reward: v.optional(v.string()), // card back ID or other reward
    earnedAt: v.number(),
    openedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"]),
});
