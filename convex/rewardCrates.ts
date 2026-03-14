import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const CARD_BACKS_BY_CRATE: Record<string, string[]> = {
  bronze: ["neon", "matrix"],
  silver: ["galaxy", "matrix", "neon"],
  gold: ["fire", "glitch", "galaxy", "neon"],
  diamond: ["holographic", "rainbow", "fire", "glitch", "galaxy"],
};

/** Award a crate to a user based on win milestones */
export const awardCrate = mutation({
  args: {
    userId: v.id("users"),
    crateType: v.string(),
  },
  handler: async (ctx, { userId, crateType }) => {
    return ctx.db.insert("rewardCrates", {
      userId,
      crateType,
      opened: false,
      earnedAt: Date.now(),
    });
  },
});

/** Open a crate and reveal the reward */
export const openCrate = mutation({
  args: {
    crateId: v.id("rewardCrates"),
    userId: v.id("users"),
  },
  handler: async (ctx, { crateId, userId }) => {
    const crate = await ctx.db.get(crateId);
    if (!crate) throw new Error("Crate not found");
    if (crate.userId !== userId) throw new Error("Not your crate");
    if (crate.opened) throw new Error("Crate already opened");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Pick a random card back based on crate type
    const possibleRewards = CARD_BACKS_BY_CRATE[crate.crateType] || ["neon"];
    const alreadyUnlocked = new Set(user.unlockedCardBacks ?? []);

    // Prefer giving unrewarded items
    const newRewards = possibleRewards.filter((r) => !alreadyUnlocked.has(r));
    const pool = newRewards.length > 0 ? newRewards : possibleRewards;
    const reward = pool[Math.floor(Math.random() * pool.length)];

    await ctx.db.patch(crateId, {
      opened: true,
      reward,
      openedAt: Date.now(),
    });

    // Add to user's unlocked card backs
    const unlocked = [...(user.unlockedCardBacks ?? [])];
    if (!unlocked.includes(reward)) {
      unlocked.push(reward);
      await ctx.db.patch(userId, { unlockedCardBacks: unlocked });
    }

    // XP bonus for opening
    await ctx.db.patch(userId, { xp: (user.xp ?? 0) + 15 });

    // Notify
    await ctx.db.insert("notifications", {
      userId,
      type: "crate_opened",
      message: `You unlocked a new card back: ${reward}!`,
      read: false,
      createdAt: Date.now(),
    });

    return reward;
  },
});

/** Get user's crates (unopened first) */
export const getMyCrates = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const crates = await ctx.db
      .query("rewardCrates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort: unopened first, then by earned date desc
    return crates.sort((a, b) => {
      if (a.opened !== b.opened) return a.opened ? 1 : -1;
      return b.earnedAt - a.earnedAt;
    });
  },
});

/** Select a card back */
export const selectCardBack = mutation({
  args: { userId: v.id("users"), cardBackId: v.string() },
  handler: async (ctx, { userId, cardBackId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (cardBackId !== "default" && !(user.unlockedCardBacks ?? []).includes(cardBackId)) {
      throw new Error("Card back not unlocked");
    }

    await ctx.db.patch(userId, { selectedCardBack: cardBackId });
  },
});

/** Check if user should receive a crate after winning */
export const checkCrateAward = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const wins = user.gamesWon;
    // Award crates at specific win milestones
    const crateThresholds = [
      { wins: 1, type: "bronze" },
      { wins: 3, type: "silver" },
      { wins: 5, type: "gold" },
      { wins: 10, type: "diamond" },
      { wins: 15, type: "gold" },
      { wins: 20, type: "diamond" },
      { wins: 30, type: "diamond" },
      { wins: 50, type: "diamond" },
    ];

    // Check if user just hit a milestone
    const milestone = crateThresholds.find((t) => t.wins === wins);
    if (!milestone) return null;

    // Award the crate
    const crateId = await ctx.db.insert("rewardCrates", {
      userId,
      crateType: milestone.type,
      opened: false,
      earnedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId,
      type: "crate_earned",
      message: `You earned a ${milestone.type} crate for ${wins} wins!`,
      read: false,
      createdAt: Date.now(),
    });

    return { crateId, crateType: milestone.type };
  },
});
