import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Record a rivalry result between two personas */
export const recordResult = mutation({
  args: {
    winnerPersonaId: v.string(),
    loserPersonaId: v.string(),
  },
  handler: async (ctx, { winnerPersonaId, loserPersonaId }) => {
    // Always store in consistent order (alphabetical)
    const [persona1Id, persona2Id] = [winnerPersonaId, loserPersonaId].sort();

    const existing = await ctx.db
      .query("personaRivalries")
      .withIndex("by_matchup", (q) =>
        q.eq("persona1Id", persona1Id).eq("persona2Id", persona2Id)
      )
      .first();

    if (existing) {
      const isWinnerP1 = winnerPersonaId === persona1Id;
      await ctx.db.patch(existing._id, {
        persona1Wins: existing.persona1Wins + (isWinnerP1 ? 1 : 0),
        persona2Wins: existing.persona2Wins + (isWinnerP1 ? 0 : 1),
        totalGames: existing.totalGames + 1,
        lastGameAt: Date.now(),
      });
    } else {
      const isWinnerP1 = winnerPersonaId === persona1Id;
      await ctx.db.insert("personaRivalries", {
        persona1Id,
        persona2Id,
        persona1Wins: isWinnerP1 ? 1 : 0,
        persona2Wins: isWinnerP1 ? 0 : 1,
        totalGames: 1,
        lastGameAt: Date.now(),
      });
    }
  },
});

/** Get all rivalries */
export const getAllRivalries = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("personaRivalries").collect();
  },
});

/** Get rivalries for a specific persona */
export const getPersonaRivalries = query({
  args: { personaId: v.string() },
  handler: async (ctx, { personaId }) => {
    const allRivalries = await ctx.db.query("personaRivalries").collect();
    return allRivalries.filter(
      (r) => r.persona1Id === personaId || r.persona2Id === personaId
    );
  },
});
