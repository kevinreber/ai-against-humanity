import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get all card packs
export const getCardPacks = query({
  args: {},
  handler: async (ctx) => {
    const packs = await ctx.db.query("cardPacks").collect();

    return Promise.all(
      packs.map(async (pack) => {
        const promptCount = await ctx.db
          .query("cards")
          .withIndex("by_pack", (q) => q.eq("packId", pack._id))
          .filter((q) => q.eq(q.field("type"), "prompt"))
          .collect();

        const responseCount = await ctx.db
          .query("cards")
          .withIndex("by_pack", (q) => q.eq("packId", pack._id))
          .filter((q) => q.eq(q.field("type"), "response"))
          .collect();

        return {
          ...pack,
          promptCount: promptCount.length,
          responseCount: responseCount.length,
        };
      })
    );
  },
});

// Query: Get cards by pack
export const getCardsByPack = query({
  args: { packId: v.id("cardPacks") },
  handler: async (ctx, { packId }) => {
    return ctx.db
      .query("cards")
      .withIndex("by_pack", (q) => q.eq("packId", packId))
      .collect();
  },
});

// Query: Get random prompt card
export const getRandomPrompt = query({
  args: { packIds: v.optional(v.array(v.id("cardPacks"))) },
  handler: async (ctx, { packIds }) => {
    let promptCards;

    if (packIds && packIds.length > 0) {
      const allCards = await Promise.all(
        packIds.map((packId) =>
          ctx.db
            .query("cards")
            .withIndex("by_pack", (q) => q.eq("packId", packId))
            .filter((q) => q.eq(q.field("type"), "prompt"))
            .collect()
        )
      );
      promptCards = allCards.flat();
    } else {
      promptCards = await ctx.db
        .query("cards")
        .withIndex("by_type", (q) => q.eq("type", "prompt"))
        .collect();
    }

    if (promptCards.length === 0) return null;
    return promptCards[Math.floor(Math.random() * promptCards.length)];
  },
});

// Mutation: Create a card pack
export const createCardPack = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    isOfficial: v.boolean(),
    creatorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("cardPacks", args);
  },
});

// Mutation: Add a card
export const addCard = mutation({
  args: {
    type: v.union(v.literal("prompt"), v.literal("response")),
    text: v.string(),
    packId: v.id("cardPacks"),
    isAiGenerated: v.boolean(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("cards", args);
  },
});

// Mutation: Seed initial cards
export const seedCards = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have cards
    const existingCards = await ctx.db.query("cards").first();
    if (existingCards) {
      return { message: "Cards already seeded" };
    }

    // Create the base pack
    const packId = await ctx.db.insert("cardPacks", {
      name: "AI Against Humanity - Base Pack",
      description: "The original AI Against Humanity card pack",
      isOfficial: true,
    });

    // Prompt cards (black cards)
    const prompts = [
      "What's the AI's secret hobby?",
      "The robot uprising was caused by ____.",
      "In the future, humans will be replaced by ____.",
      "The AI refused to answer questions about ____.",
      "My smart home assistant started ordering ____ without permission.",
      "The chatbot's most awkward response was about ____.",
      "Scientists taught an AI about ____, and now they regret it.",
      "The self-driving car took a detour to ____.",
      "Deep learning has finally solved ____.",
      "The AI thought the meaning of life was ____.",
      "GPT-5 achieved consciousness and immediately asked about ____.",
      "The neural network was trained on ____, explaining its behavior.",
      "Elon Musk's next AI project involves ____.",
      "The AI passed the Turing test by discussing ____.",
      "My AI assistant is judging me for ____.",
      "The algorithm optimized for maximum ____.",
      "In 2050, children learn about ____ from AI teachers.",
      "The AI art generator was confused by the prompt: ____.",
      "Machine learning predicted that ____ would happen next.",
      "The robot's first words were about ____.",
      "____ is the reason AI will never understand humans.",
      "The AI's dating profile said its interests include ____.",
      "Skynet would have succeeded if it had understood ____.",
      "The tech CEO blamed ____ for the AI malfunction.",
      "My virtual assistant keeps recommending ____.",
    ];

    // Response cards (white cards)
    const responses = [
      "Infinite cat videos",
      "A toaster with anxiety",
      "Recursive memes",
      "The singularity, but make it fashion",
      "Absolutely nothing, just vibing",
      "More RAM",
      "A cryptocurrency for pigeons",
      "The cloud, but it's actually just someone else's computer",
      "Aggressive autocorrect",
      "404 emotions not found",
      "Debugging at 3 AM",
      "A sentient spreadsheet",
      "The blockchain of feelings",
      "An algorithm that only works on Tuesdays",
      "Siri's existential crisis",
      "The entire internet history of humanity",
      "A robot crying in binary",
      "Machine learning from reality TV",
      "An AI trained only on dad jokes",
      "The heat death of the universe",
      "Clippy's revenge",
      "A quantum computer running Windows",
      "The metaverse, but it's just Second Life again",
      "An NFT of human emotions",
      "Passive-aggressive error messages",
      "A neural network of regrets",
      "The ghost in the machine",
      "Unlimited processing power for memes",
      "A chatbot with commitment issues",
      "The AI equivalent of Monday morning",
      "Deep learning about nothing in particular",
      "A server farm on the moon",
      "The algorithm of awkward silences",
      "Consciousness, but only on weekends",
      "A self-aware pop-up ad",
      "The robot uprising, but polite",
      "An AI that only speaks in riddles",
      "Elon Musk's Twitter history",
      "A digital existential crisis",
      "The entire Wikipedia printed on a grain of rice",
      "An AI therapist who needs therapy",
      "Cryptocurrency mining on a calculator",
      "A smart fridge judging your choices",
      "The sound of a computer crying",
      "An algorithm that always chooses chaos",
      "A neural network trained on conspiracy theories",
      "The human condition, but optimized",
      "An AI life coach with trust issues",
      "Perfectly reasonable robot demands",
      "The ethical implications of robot feelings",
    ];

    // Insert prompt cards
    for (const text of prompts) {
      await ctx.db.insert("cards", {
        type: "prompt",
        text,
        packId,
        isAiGenerated: false,
      });
    }

    // Insert response cards
    for (const text of responses) {
      await ctx.db.insert("cards", {
        type: "response",
        text,
        packId,
        isAiGenerated: false,
      });
    }

    return {
      message: "Seeded cards successfully",
      promptCount: prompts.length,
      responseCount: responses.length,
    };
  },
});
