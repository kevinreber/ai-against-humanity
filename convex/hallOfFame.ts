import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Get Hall of Fame highlights (top voted, featured) */
export const getHallOfFame = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const highlights = await ctx.db.query("roundHighlights").collect();

    // Sort by upvotes desc
    const sorted = highlights
      .filter((h) => (h.upvotes ?? 0) > 0 || h.isFeatured)
      .sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
      .slice(0, limit ?? 20);

    // Get username for each
    const withUsers = await Promise.all(
      sorted.map(async (h) => {
        const user = await ctx.db.get(h.savedBy);
        return {
          ...h,
          savedByUsername: user?.username ?? "Unknown",
          savedByAvatar: user?.avatar,
        };
      })
    );

    return withUsers;
  },
});

/** Upvote a highlight */
export const upvoteHighlight = mutation({
  args: {
    highlightId: v.id("roundHighlights"),
    userId: v.id("users"),
  },
  handler: async (ctx, { highlightId, userId }) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("hallOfFameVotes")
      .withIndex("by_highlight_and_user", (q) =>
        q.eq("highlightId", highlightId).eq("userId", userId)
      )
      .first();

    if (existing) {
      // Remove vote (toggle)
      await ctx.db.delete(existing._id);
      const highlight = await ctx.db.get(highlightId);
      if (highlight) {
        await ctx.db.patch(highlightId, {
          upvotes: Math.max(0, (highlight.upvotes ?? 1) - 1),
        });
      }
      return { action: "removed" };
    }

    await ctx.db.insert("hallOfFameVotes", { highlightId, userId });

    const highlight = await ctx.db.get(highlightId);
    if (highlight) {
      const newUpvotes = (highlight.upvotes ?? 0) + 1;
      await ctx.db.patch(highlightId, {
        upvotes: newUpvotes,
        // Auto-feature highlights with 5+ upvotes
        ...(newUpvotes >= 5 ? { isFeatured: true } : {}),
      });
    }

    return { action: "added" };
  },
});

/** Check if user has upvoted a highlight */
export const hasUpvoted = query({
  args: { highlightId: v.id("roundHighlights"), userId: v.id("users") },
  handler: async (ctx, { highlightId, userId }) => {
    const existing = await ctx.db
      .query("hallOfFameVotes")
      .withIndex("by_highlight_and_user", (q) =>
        q.eq("highlightId", highlightId).eq("userId", userId)
      )
      .first();
    return !!existing;
  },
});
