import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Internal queries & mutations for AI generation.
// These MUST live outside "use node" files — Convex only allows actions in
// Node.js runtime modules.
// ---------------------------------------------------------------------------

const MAX_CACHED_RESPONSES_PER_PROMPT = 5;

// Get round info needed for AI generation
export const getRoundInfo = internalQuery({
  args: { roundId: v.id("rounds"), gameId: v.id("games") },
  handler: async (ctx, { roundId, gameId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) return null;

    const promptCard = await ctx.db.get(round.promptCardId);

    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();

    // Get the game to find the host (for API key lookup)
    const game = await ctx.db.get(gameId);

    return { round, promptCard, players, submissions, hostId: game?.hostId };
  },
});

// Look up a custom persona from the DB
export const getCustomPersona = internalQuery({
  args: { personaId: v.string() },
  handler: async (ctx, { personaId }) => {
    // Try to load it as a document ID from customPersonas table
    try {
      const persona = await ctx.db.get(personaId as any);
      if (persona) {
        return {
          name: persona.name as string,
          systemPrompt: persona.systemPrompt as string,
          temperature: persona.temperature as number,
        };
      }
    } catch {
      // Not a valid ID, that's fine
    }
    return null;
  },
});

// Check cache for an existing response pool
export const getCachedResponse = internalQuery({
  args: { promptText: v.string(), personaId: v.string() },
  handler: async (ctx, { promptText, personaId }) => {
    return ctx.db
      .query("aiResponseCache")
      .withIndex("by_prompt_persona", (q) =>
        q.eq("promptText", promptText).eq("personaId", personaId)
      )
      .first();
  },
});

// Save a new response to the cache pool
export const saveToCache = internalMutation({
  args: {
    promptText: v.string(),
    personaId: v.string(),
    response: v.string(),
  },
  handler: async (ctx, { promptText, personaId, response }) => {
    const existing = await ctx.db
      .query("aiResponseCache")
      .withIndex("by_prompt_persona", (q) =>
        q.eq("promptText", promptText).eq("personaId", personaId)
      )
      .first();

    if (existing) {
      if (
        !existing.responses.includes(response) &&
        existing.responses.length < MAX_CACHED_RESPONSES_PER_PROMPT
      ) {
        await ctx.db.patch(existing._id, {
          responses: [...existing.responses, response],
        });
      }
    } else {
      await ctx.db.insert("aiResponseCache", {
        promptText,
        personaId,
        responses: [response],
      });
    }
  },
});

// Submit an AI-generated card (server-side, with deduplication)
export const submitAiCard = internalMutation({
  args: {
    roundId: v.id("rounds"),
    playerId: v.id("gamePlayers"),
    aiGeneratedText: v.string(),
  },
  handler: async (ctx, { roundId, playerId, aiGeneratedText }) => {
    const round = await ctx.db.get(roundId);
    if (!round || round.status !== "submitting") return;

    // Deduplicate: skip if this player already submitted
    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .filter((q) => q.eq(q.field("playerId"), playerId))
      .first();
    if (existing) return;

    await ctx.db.insert("submissions", {
      roundId,
      playerId,
      aiGeneratedText,
    });
  },
});

// Check if all submissions are in and move to judging if so
export const checkAndMoveToJudging = internalMutation({
  args: { roundId: v.id("rounds"), gameId: v.id("games") },
  handler: async (ctx, { roundId, gameId }) => {
    const round = await ctx.db.get(roundId);
    if (!round || round.status !== "submitting") return;

    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    const nonJudgePlayers = players.filter(
      (p) => p._id !== round.judgePlayerId
    );

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();

    if (submissions.length >= nonJudgePlayers.length) {
      await ctx.db.patch(roundId, { status: "judging" });
    }
  },
});
