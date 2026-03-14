import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Get all achievements for a user */
export const getUserAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Check if user has a specific achievement */
export const hasAchievement = query({
  args: { userId: v.id("users"), achievementId: v.string() },
  handler: async (ctx, { userId, achievementId }) => {
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user_and_achievement", (q) =>
        q.eq("userId", userId).eq("achievementId", achievementId)
      )
      .first();
    return !!existing;
  },
});

/** Unlock an achievement for a user */
export const unlockAchievement = mutation({
  args: {
    userId: v.id("users"),
    achievementId: v.string(),
    xpReward: v.number(),
  },
  handler: async (ctx, { userId, achievementId, xpReward }) => {
    // Check if already unlocked
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user_and_achievement", (q) =>
        q.eq("userId", userId).eq("achievementId", achievementId)
      )
      .first();

    if (existing) return null;

    await ctx.db.insert("achievements", {
      userId,
      achievementId,
      unlockedAt: Date.now(),
    });

    // Award XP
    if (xpReward > 0) {
      const user = await ctx.db.get(userId);
      if (user) {
        await ctx.db.patch(userId, { xp: (user.xp ?? 0) + xpReward });
      }
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId,
      type: "achievement",
      message: `Achievement unlocked: ${achievementId}`,
      read: false,
      createdAt: Date.now(),
    });

    return achievementId;
  },
});

/** Check and award achievements based on user stats */
export const checkAchievements = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;

    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const unlockedIds = new Set(existing.map((a) => a.achievementId));
    const newlyUnlocked: string[] = [];

    const tryUnlock = async (id: string, condition: boolean, xp: number) => {
      if (!unlockedIds.has(id) && condition) {
        await ctx.db.insert("achievements", { userId, achievementId: id, unlockedAt: Date.now() });
        newlyUnlocked.push(id);
        await ctx.db.patch(userId, { xp: (user.xp ?? 0) + xp });
      }
    };

    // Win-based achievements
    await tryUnlock("first-win", user.gamesWon >= 1, 25);
    await tryUnlock("win-5", user.gamesWon >= 5, 50);
    await tryUnlock("win-25", user.gamesWon >= 25, 100);

    // Play-based achievements
    await tryUnlock("play-10", user.gamesPlayed >= 10, 25);
    await tryUnlock("play-50", user.gamesPlayed >= 50, 75);

    // Daily challenge achievements
    await tryUnlock("daily-3", (user.dailyChallengesCompleted ?? 0) >= 3, 30);
    await tryUnlock("daily-7", (user.dailyChallengeStreak ?? 0) >= 7, 75);

    // Persona creator
    const myPersonas = await ctx.db
      .query("customPersonas")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();
    await tryUnlock("persona-creator", myPersonas.length > 0, 20);

    // Popular persona (10+ installs)
    const hasPopular = myPersonas.some((p) => (p.installCount ?? 0) >= 10);
    await tryUnlock("popular-persona", hasPopular, 50);

    // Highlight saver
    const highlights = await ctx.db
      .query("roundHighlights")
      .withIndex("by_user", (q) => q.eq("savedBy", userId))
      .collect();
    await tryUnlock("highlight-saver", highlights.length >= 10, 25);

    // Friends
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();
    await tryUnlock("social-butterfly", friendships.length >= 5, 25);

    // Beat all AI
    const beaten = user.aiPersonasBeaten ?? [];
    const allPersonas = ["chaotic-carl", "sophisticated-sophie", "edgy-eddie", "wholesome-wendy", "literal-larry"];
    await tryUnlock("beat-all-ai", allPersonas.every((p) => beaten.includes(p)), 100);

    // Notify for newly unlocked
    for (const id of newlyUnlocked) {
      await ctx.db.insert("notifications", {
        userId,
        type: "achievement",
        message: `Achievement unlocked: ${id}`,
        read: false,
        createdAt: Date.now(),
      });
    }

    return newlyUnlocked;
  },
});
