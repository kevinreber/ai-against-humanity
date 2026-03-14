import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const XP_LEVELS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 300 },
  { level: 4, xpRequired: 600 },
  { level: 5, xpRequired: 1000 },
  { level: 6, xpRequired: 1500 },
  { level: 7, xpRequired: 2500 },
  { level: 8, xpRequired: 4000 },
  { level: 9, xpRequired: 6000 },
  { level: 10, xpRequired: 10000 },
];

function calculateLevel(xp: number): number {
  let level = 1;
  for (const l of XP_LEVELS) {
    if (xp >= l.xpRequired) level = l.level;
  }
  return level;
}

/** Add XP to a user and recalculate level */
export const addXp = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { userId, amount, reason }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;

    const newXp = (user.xp ?? 0) + amount;
    const newLevel = calculateLevel(newXp);
    const oldLevel = user.level ?? 1;

    await ctx.db.patch(userId, { xp: newXp, level: newLevel });

    // Create notification on level up
    if (newLevel > oldLevel) {
      await ctx.db.insert("notifications", {
        userId,
        type: "level_up",
        message: `You reached Level ${newLevel}! 🎉`,
        read: false,
        createdAt: Date.now(),
      });
    }

    return { newXp, newLevel, leveledUp: newLevel > oldLevel };
  },
});

/** Get user's XP and level info */
export const getUserXp = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const xp = user.xp ?? 0;
    const level = calculateLevel(xp);
    const currentLevelXp = XP_LEVELS.find((l) => l.level === level)?.xpRequired ?? 0;
    const nextLevelXp = XP_LEVELS.find((l) => l.level === level + 1)?.xpRequired;
    const progress = nextLevelXp
      ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
      : 100;

    return {
      xp,
      level,
      progress,
      nextLevelXp,
      currentLevelXp,
    };
  },
});
