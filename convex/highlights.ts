import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Feature 7: Replay Highlights — save & share best rounds

/** Save a round as a highlight */
export const saveHighlight = mutation({
  args: {
    gameId: v.id("games"),
    roundId: v.id("rounds"),
    savedBy: v.id("users"),
    promptText: v.string(),
    winningResponse: v.string(),
    winnerName: v.string(),
    roastCommentary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("roundHighlights")
      .withIndex("by_user", (q) => q.eq("savedBy", args.savedBy))
      .filter((q) => q.eq(q.field("roundId"), args.roundId))
      .first();

    if (existing) throw new Error("Already saved this highlight");

    return ctx.db.insert("roundHighlights", {
      ...args,
      savedAt: Date.now(),
    });
  },
});

/** Get highlights saved by a user */
export const getMyHighlights = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("roundHighlights")
      .withIndex("by_user", (q) => q.eq("savedBy", userId))
      .order("desc")
      .collect();
  },
});

/** Get a single highlight by ID (for sharing) */
export const getHighlight = query({
  args: { highlightId: v.id("roundHighlights") },
  handler: async (ctx, { highlightId }) => {
    return ctx.db.get(highlightId);
  },
});

/** Delete a highlight */
export const deleteHighlight = mutation({
  args: { highlightId: v.id("roundHighlights"), userId: v.id("users") },
  handler: async (ctx, { highlightId, userId }) => {
    const highlight = await ctx.db.get(highlightId);
    if (!highlight) throw new Error("Highlight not found");
    if (highlight.savedBy !== userId) throw new Error("Not your highlight");
    await ctx.db.delete(highlightId);
  },
});
