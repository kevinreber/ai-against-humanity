import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Feature 1: Audience Vote Mode — lets spectators/players vote on submissions

/** Cast a vote for a submission */
export const castVote = mutation({
  args: {
    roundId: v.id("rounds"),
    oderId: v.id("users"),
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, { roundId, oderId, submissionId }) => {
    const round = await ctx.db.get(roundId);
    if (!round || round.status !== "judging") {
      throw new Error("Voting is only available during judging phase");
    }

    // Check if user already voted this round
    const existing = await ctx.db
      .query("audienceVotes")
      .withIndex("by_round_and_voter", (q) =>
        q.eq("roundId", roundId).eq("oderId", oderId)
      )
      .first();

    if (existing) {
      // Update vote
      await ctx.db.patch(existing._id, { submissionId });
      return;
    }

    await ctx.db.insert("audienceVotes", {
      roundId,
      oderId,
      submissionId,
    });
  },
});

/** Get vote counts for a round */
export const getVotes = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const votes = await ctx.db
      .query("audienceVotes")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();

    // Count votes per submission
    const counts: Record<string, number> = {};
    for (const vote of votes) {
      counts[vote.submissionId] = (counts[vote.submissionId] || 0) + 1;
    }

    return { votes: counts, totalVotes: votes.length };
  },
});

/** Get current user's vote for a round */
export const getMyVote = query({
  args: { roundId: v.id("rounds"), oderId: v.id("users") },
  handler: async (ctx, { roundId, oderId }) => {
    const vote = await ctx.db
      .query("audienceVotes")
      .withIndex("by_round_and_voter", (q) =>
        q.eq("roundId", roundId).eq("oderId", oderId)
      )
      .first();
    return vote?.submissionId ?? null;
  },
});
