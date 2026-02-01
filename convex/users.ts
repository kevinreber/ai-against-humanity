import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Query: Get user by username
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
  },
});

// Query: Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

// Mutation: Create or update user (for auth sync)
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.optional(v.string()),
    username: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        clerkId: args.clerkId,
        username: args.username,
        avatarUrl: args.avatarUrl,
      });
      return existingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      ...args,
      gamesPlayed: 0,
      gamesWon: 0,
    });
  },
});

// Mutation: Create guest user (no auth required)
export const createGuestUser = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    // Generate a unique guest email
    const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}@guest.local`;

    return await ctx.db.insert("users", {
      username,
      email: guestEmail,
      gamesPlayed: 0,
      gamesWon: 0,
    });
  },
});

// Mutation: Update user stats after game
export const updateUserStats = mutation({
  args: {
    userId: v.id("users"),
    won: v.boolean(),
  },
  handler: async (ctx, { userId, won }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      gamesPlayed: user.gamesPlayed + 1,
      gamesWon: won ? user.gamesWon + 1 : user.gamesWon,
    });
  },
});

// Query: Get leaderboard
export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const users = await ctx.db.query("users").collect();

    // Sort by wins, then by win rate
    const sorted = users
      .filter((u) => u.gamesPlayed > 0)
      .sort((a, b) => {
        if (b.gamesWon !== a.gamesWon) {
          return b.gamesWon - a.gamesWon;
        }
        const aRate = a.gamesWon / a.gamesPlayed;
        const bRate = b.gamesWon / b.gamesPlayed;
        return bRate - aRate;
      })
      .slice(0, limit ?? 10);

    return sorted.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      gamesPlayed: u.gamesPlayed,
      gamesWon: u.gamesWon,
      winRate: u.gamesPlayed > 0 ? (u.gamesWon / u.gamesPlayed) * 100 : 0,
    }));
  },
});
