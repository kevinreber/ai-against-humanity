import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db.get(userId);
  },
});

// Query: Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

// Query: Get user by username
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
  },
});

// Query: Get leaderboard
export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const users = await ctx.db.query("users").collect();

    // Sort by games won, then by win rate
    const sorted = users.sort((a, b) => {
      if (b.gamesWon !== a.gamesWon) {
        return b.gamesWon - a.gamesWon;
      }
      const aWinRate = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0;
      const bWinRate = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0;
      return bWinRate - aWinRate;
    });

    return sorted.slice(0, limit ?? 10);
  },
});

// Mutation: Create or update user
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.optional(v.string()),
    username: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, username, email, avatarUrl }) => {
    // Check if user exists by clerkId or email
    let existingUser = null;

    if (clerkId) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
    }

    if (!existingUser) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
    }

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        username,
        avatarUrl,
        ...(clerkId && { clerkId }),
      });
      return existingUser._id;
    }

    // Create new user
    return ctx.db.insert("users", {
      clerkId,
      username,
      email,
      avatarUrl,
      gamesPlayed: 0,
      gamesWon: 0,
    });
  },
});

// Mutation: Create guest user
export const createGuestUser = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    // Generate a unique guest email
    const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}@guest.local`;

    return ctx.db.insert("users", {
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
      gamesWon: user.gamesWon + (won ? 1 : 0),
    });
  },
});
