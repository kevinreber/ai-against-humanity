import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Join a game as a spectator */
export const joinAsSpectator = mutation({
  args: { gameId: v.id("games"), userId: v.id("users") },
  handler: async (ctx, { gameId, userId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");

    // Check if already in game
    const existing = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) return; // Already in game (player or spectator)

    await ctx.db.insert("gamePlayers", {
      gameId,
      userId,
      isAi: false,
      score: 0,
      isJudge: false,
      hand: [],
      isSpectator: true,
    });
  },
});

/** Send a chat message as spectator */
export const sendMessage = mutation({
  args: {
    gameId: v.id("games"),
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, { gameId, userId, message }) => {
    if (message.trim().length < 1 || message.length > 200) {
      throw new Error("Message must be 1-200 characters");
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.insert("spectatorChat", {
      gameId,
      userId,
      username: user.username,
      message: message.trim(),
      createdAt: Date.now(),
    });
  },
});

/** Get recent chat messages for a game */
export const getMessages = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    return ctx.db
      .query("spectatorChat")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .order("desc")
      .take(50);
  },
});

/** Get spectator count for a game */
export const getSpectatorCount = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const spectators = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .filter((q) => q.eq(q.field("isSpectator"), true))
      .collect();
    return spectators.length;
  },
});
