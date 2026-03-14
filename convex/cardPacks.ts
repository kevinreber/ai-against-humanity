import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Feature 4: Card Pack Creator

/** Get all card packs */
export const listPacks = query({
  args: {},
  handler: async (ctx) => {
    const packs = await ctx.db.query("cardPacks").collect();
    const packsWithCounts = await Promise.all(
      packs.map(async (pack) => {
        const cards = await ctx.db
          .query("cards")
          .withIndex("by_pack", (q) => q.eq("packId", pack._id))
          .collect();
        const creator = pack.creatorId
          ? await ctx.db.get(pack.creatorId)
          : null;
        return {
          ...pack,
          cardCount: cards.length,
          promptCount: cards.filter((c) => c.type === "prompt").length,
          responseCount: cards.filter((c) => c.type === "response").length,
          creatorName: creator?.username ?? "Official",
        };
      })
    );
    return packsWithCounts;
  },
});

/** Get packs created by a user */
export const getMyPacks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const packs = await ctx.db
      .query("cardPacks")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();
    const packsWithCounts = await Promise.all(
      packs.map(async (pack) => {
        const cards = await ctx.db
          .query("cards")
          .withIndex("by_pack", (q) => q.eq("packId", pack._id))
          .collect();
        return {
          ...pack,
          cardCount: cards.length,
          cards,
        };
      })
    );
    return packsWithCounts;
  },
});

/** Create a new card pack */
export const createPack = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    creatorId: v.id("users"),
  },
  handler: async (ctx, { name, description, creatorId }) => {
    if (name.trim().length < 1 || name.length > 50) {
      throw new Error("Pack name must be 1-50 characters");
    }
    if (description.trim().length < 1 || description.length > 200) {
      throw new Error("Description must be 1-200 characters");
    }

    // Limit packs per user
    const existing = await ctx.db
      .query("cardPacks")
      .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
      .collect();
    if (existing.length >= 10) {
      throw new Error("Maximum 10 card packs per user");
    }

    return ctx.db.insert("cardPacks", {
      name: name.trim(),
      description: description.trim(),
      isOfficial: false,
      creatorId,
    });
  },
});

/** Add a card to a pack */
export const addCard = mutation({
  args: {
    packId: v.id("cardPacks"),
    type: v.union(v.literal("prompt"), v.literal("response")),
    text: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { packId, type, text, userId }) => {
    const pack = await ctx.db.get(packId);
    if (!pack) throw new Error("Pack not found");
    if (pack.creatorId !== userId) {
      throw new Error("You can only add cards to your own packs");
    }

    if (text.trim().length < 1 || text.length > 200) {
      throw new Error("Card text must be 1-200 characters");
    }

    // Limit cards per pack
    const existing = await ctx.db
      .query("cards")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
    if (existing.length >= 100) {
      throw new Error("Maximum 100 cards per pack");
    }

    return ctx.db.insert("cards", {
      packId,
      type,
      text: text.trim(),
      isAiGenerated: false,
    });
  },
});

/** Delete a card */
export const deleteCard = mutation({
  args: { cardId: v.id("cards"), userId: v.id("users") },
  handler: async (ctx, { cardId, userId }) => {
    const card = await ctx.db.get(cardId);
    if (!card) throw new Error("Card not found");

    const pack = await ctx.db.get(card.packId);
    if (!pack || pack.creatorId !== userId) {
      throw new Error("You can only delete cards from your own packs");
    }

    await ctx.db.delete(cardId);
  },
});

/** Delete a pack and all its cards */
export const deletePack = mutation({
  args: { packId: v.id("cardPacks"), userId: v.id("users") },
  handler: async (ctx, { packId, userId }) => {
    const pack = await ctx.db.get(packId);
    if (!pack) throw new Error("Pack not found");
    if (pack.creatorId !== userId) {
      throw new Error("You can only delete your own packs");
    }

    // Delete all cards in the pack
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
    for (const card of cards) {
      await ctx.db.delete(card._id);
    }

    await ctx.db.delete(packId);
  },
});
