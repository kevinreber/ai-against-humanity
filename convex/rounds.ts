import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Query: Get round details
export const getRound = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) return null;

    const promptCard = await ctx.db.get(round.promptCardId);
    const judge = await ctx.db.get(round.judgePlayerId);

    return { round, promptCard, judge };
  },
});

// Query: Get submissions for a round
export const getSubmissions = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();

    // Get card text for each submission
    const submissionsWithText = await Promise.all(
      submissions.map(async (sub) => {
        let text = sub.aiGeneratedText;
        if (sub.cardId) {
          const card = await ctx.db.get(sub.cardId);
          text = card?.text;
        }
        const player = await ctx.db.get(sub.playerId);
        return { ...sub, text, player };
      })
    );

    return submissionsWithText;
  },
});

// Query: Check if all submissions are in
export const areAllSubmissionsIn = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) return false;

    const game = await ctx.db.get(round.gameId);
    if (!game) return false;

    // Get all non-judge players
    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", round.gameId))
      .filter((q) => q.neq(q.field("_id"), round.judgePlayerId))
      .collect();

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();

    return submissions.length >= players.length;
  },
});

// Mutation: Move round to judging phase
export const moveToJudging = mutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) throw new Error("Round not found");
    if (round.status !== "submitting") throw new Error("Round not in submitting phase");

    await ctx.db.patch(roundId, { status: "judging" });
  },
});

// Internal mutation: Auto-timeout for slow players
export const autoTimeout = internalMutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) return;

    if (round.status === "submitting") {
      // Move to judging even if not all submissions are in
      await ctx.db.patch(roundId, { status: "judging" });
    }
  },
});

// Mutation: Start round with timeout scheduler
export const startRoundWithTimeout = mutation({
  args: { gameId: v.id("games"), timeoutMs: v.optional(v.number()) },
  handler: async (ctx, { gameId, timeoutMs }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");

    const round = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_round", (q) =>
        q.eq("gameId", gameId).eq("roundNumber", game.currentRound)
      )
      .first();

    if (!round) throw new Error("Round not found");

    // Schedule auto-timeout (default 60 seconds)
    const timeout = timeoutMs ?? 60000;
    await ctx.scheduler.runAfter(timeout, internal.rounds.autoTimeout, {
      roundId: round._id,
    });

    return round._id;
  },
});
