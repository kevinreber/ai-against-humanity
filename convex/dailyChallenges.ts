import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Daily challenge prompts pool
const DAILY_PROMPTS = [
  "The real reason AI will take over the world is _______.",
  "My therapist said I need to stop _______.",
  "The worst thing to find in your search history: _______.",
  "In 2050, the most popular hobby will be _______.",
  "The government is secretly hiding _______ from us.",
  "I got fired from my job for _______.",
  "The next big social media trend: _______.",
  "My dating profile says I'm into _______.",
  "Scientists just discovered that _______ cures depression.",
  "The real meaning of life is _______.",
  "I told my grandma about _______ and she fainted.",
  "The worst superpower would be _______.",
  "Breaking news: _______ declared illegal in 47 states.",
  "My last words will be _______.",
  "The secret ingredient in grandma's cookies is _______.",
];

const DAILY_THEMES = [
  "Answers must be exactly 5 words",
  "Respond in the style of a news headline",
  "Answer like a caveman",
  undefined,
  undefined,
  undefined, // No theme ~50% of the time
];

/** Get today's daily challenge (creates one if it doesn't exist) */
export const getTodaysChallenge = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const challenge = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    return challenge;
  },
});

/** Create today's daily challenge if it doesn't exist */
export const ensureDailyChallenge = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (existing) return existing._id;

    // Deterministic-ish prompt selection based on date
    const dateNum = parseInt(today.replace(/-/g, ""), 10);
    const promptIndex = dateNum % DAILY_PROMPTS.length;
    const themeIndex = dateNum % DAILY_THEMES.length;

    return ctx.db.insert("dailyChallenges", {
      date: today,
      promptText: DAILY_PROMPTS[promptIndex],
      themeModifier: DAILY_THEMES[themeIndex],
      createdAt: Date.now(),
    });
  },
});

/** Submit an entry to today's daily challenge */
export const submitEntry = mutation({
  args: {
    challengeId: v.id("dailyChallenges"),
    userId: v.id("users"),
    response: v.string(),
  },
  handler: async (ctx, { challengeId, userId, response }) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("dailyChallengeEntries")
      .withIndex("by_challenge_and_user", (q) =>
        q.eq("challengeId", challengeId).eq("userId", userId)
      )
      .first();

    if (existing) throw new Error("Already submitted to today's challenge");

    if (response.trim().length < 1 || response.length > 200) {
      throw new Error("Response must be 1-200 characters");
    }

    await ctx.db.insert("dailyChallengeEntries", {
      challengeId,
      userId,
      response: response.trim(),
      votes: 0,
      submittedAt: Date.now(),
    });

    // Update user's daily challenge tracking
    const user = await ctx.db.get(userId);
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const isConsecutive = user.lastDailyChallengeDate === yesterday;
      const newStreak = isConsecutive ? (user.dailyChallengeStreak ?? 0) + 1 : 1;

      await ctx.db.patch(userId, {
        lastDailyChallengeDate: today,
        dailyChallengeStreak: newStreak,
        dailyChallengesCompleted: (user.dailyChallengesCompleted ?? 0) + 1,
        xp: (user.xp ?? 0) + 30, // DAILY_CHALLENGE XP
      });
    }
  },
});

/** Get entries for a daily challenge */
export const getEntries = query({
  args: { challengeId: v.id("dailyChallenges") },
  handler: async (ctx, { challengeId }) => {
    const entries = await ctx.db
      .query("dailyChallengeEntries")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
      .collect();

    // Get usernames
    const entriesWithUsers = await Promise.all(
      entries.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          ...entry,
          username: user?.username ?? "Unknown",
          avatar: user?.avatar,
        };
      })
    );

    // Sort by votes desc
    return entriesWithUsers.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
  },
});

/** Vote on a daily challenge entry */
export const voteEntry = mutation({
  args: {
    challengeId: v.id("dailyChallenges"),
    voterId: v.id("users"),
    entryId: v.id("dailyChallengeEntries"),
  },
  handler: async (ctx, { challengeId, voterId, entryId }) => {
    // Check for duplicate vote
    const existing = await ctx.db
      .query("dailyChallengeVotes")
      .withIndex("by_challenge_and_voter", (q) =>
        q.eq("challengeId", challengeId).eq("voterId", voterId)
      )
      .first();

    if (existing) {
      // Change vote
      if (existing.entryId === entryId) return; // Same vote
      // Decrement old entry
      const oldEntry = await ctx.db.get(existing.entryId);
      if (oldEntry) {
        await ctx.db.patch(existing.entryId, { votes: Math.max(0, (oldEntry.votes ?? 1) - 1) });
      }
      await ctx.db.patch(existing._id, { entryId });
    } else {
      await ctx.db.insert("dailyChallengeVotes", { challengeId, voterId, entryId });
    }

    // Increment new entry votes
    const entry = await ctx.db.get(entryId);
    if (entry) {
      await ctx.db.patch(entryId, { votes: (entry.votes ?? 0) + 1 });
    }
  },
});

/** Check if user has submitted to today's challenge */
export const hasSubmittedToday = query({
  args: { challengeId: v.id("dailyChallenges"), userId: v.id("users") },
  handler: async (ctx, { challengeId, userId }) => {
    const entry = await ctx.db
      .query("dailyChallengeEntries")
      .withIndex("by_challenge_and_user", (q) =>
        q.eq("challengeId", challengeId).eq("userId", userId)
      )
      .first();
    return !!entry;
  },
});
