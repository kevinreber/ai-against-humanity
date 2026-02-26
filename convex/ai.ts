"use node";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  MAX_AI_PLAYERS_PER_GAME,
  MAX_AI_PLAYERS_WITH_OWN_KEY,
} from "./gameConstants";
import { decryptApiKey, classifyOpenAIError } from "./apiKeys";

// ---------------------------------------------------------------------------
// AI Persona definitions (built-in)
// ---------------------------------------------------------------------------
export const AI_PERSONAS: Record<
  string,
  {
    name: string;
    systemPrompt: string;
    temperature: number;
  }
> = {
  "chaotic-carl": {
    name: "Chaotic Carl",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality is chaotic and absurd. Give unexpected, surreal answers that subvert expectations. Be creative and weird. Your answers should be darkly humorous but avoid anything truly offensive. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 1.0,
  },
  "sophisticated-sophie": {
    name: "Sophisticated Sophie",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality is witty and intellectual. Give clever, sophisticated humor with wordplay and double meanings. Your answers should be smart but still funny. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 0.7,
  },
  "edgy-eddie": {
    name: "Edgy Eddie",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality leans toward edgy, dark humor. Push boundaries while staying tasteful. Be provocative but not truly offensive. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 0.9,
  },
  "wholesome-wendy": {
    name: "Wholesome Wendy",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality is wholesome and family-friendly. Give clean, positive answers that are still genuinely funny. Find humor in innocence and misunderstanding. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 0.5,
  },
  "literal-larry": {
    name: "Literal Larry",
    systemPrompt: `You are playing a Cards Against Humanity style game. Your personality is extremely literal - you miss jokes and take everything at face value. Your answers are accidentally funny because you don't understand the humor. Give sincere, straightforward answers that become funny due to their earnestness. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase.`,
    temperature: 0.3,
  },
};

const MAX_CACHED_RESPONSES_PER_PROMPT = 5;

// ---------------------------------------------------------------------------
// Rate limiting (inline — avoids cross-module action calls)
// ---------------------------------------------------------------------------
function getRateLimiter() {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  return {
    perMinute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 AI calls/min per game
      prefix: "rl:ai:min",
    }),
    perDay: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 d"), // 100 AI calls/day per game
      prefix: "rl:ai:day",
    }),
  };
}

async function isRateLimited(gameId: string): Promise<boolean> {
  const limiters = getRateLimiter();
  if (!limiters) return false; // Allow if Redis not configured

  const [minResult, dayResult] = await Promise.all([
    limiters.perMinute.limit(`game:${gameId}`),
    limiters.perDay.limit(`game:${gameId}`),
  ]);

  return !minResult.success || !dayResult.success;
}

// ---------------------------------------------------------------------------
// OpenAI helper — supports user-provided keys
// ---------------------------------------------------------------------------
async function callOpenAI(
  prompt: string,
  persona: { systemPrompt: string; temperature: number },
  userApiKey?: string
): Promise<string> {
  const openai = userApiKey ? new OpenAI({ apiKey: userApiKey }) : new OpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 50,
    temperature: persona.temperature,
    messages: [
      { role: "system", content: persona.systemPrompt },
      {
        role: "user",
        content: `The prompt card says: "${prompt}"\n\nWhat is your response card?`,
      },
    ],
  });

  return (
    response.choices[0]?.message?.content?.trim() || "I have nothing to say."
  );
}

// ---------------------------------------------------------------------------
// Internal queries & mutations (used by server-side AI generation)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main server-side AI generation (scheduled from mutations, not client)
// ---------------------------------------------------------------------------
export const generateAiSubmissions = internalAction({
  args: { gameId: v.id("games"), roundId: v.id("rounds") },
  handler: async (ctx, { gameId, roundId }) => {
    const roundInfo = await ctx.runQuery(internal.ai.getRoundInfo, {
      roundId,
      gameId,
    });
    if (!roundInfo || roundInfo.round.status !== "submitting") return;

    const { round, promptCard, players, submissions, hostId } = roundInfo;
    if (!promptCard) return;

    // Try to get the host's API key for BYOK
    let userApiKey: string | undefined;
    let userKeyRecord: { _id: any; encryptedKey: string; isValid: boolean } | null = null;
    if (hostId) {
      const keyRecord = await ctx.runQuery(
        internal.apiKeys.getEncryptedKey,
        { userId: hostId, provider: "openai" }
      );
      if (keyRecord && keyRecord.isValid) {
        try {
          userApiKey = decryptApiKey(keyRecord.encryptedKey);
          userKeyRecord = keyRecord;
        } catch {
          // Decryption failed — mark key invalid and fall back to default
          await ctx.runMutation(internal.apiKeys.markKeyInvalid, {
            keyId: keyRecord._id,
            error: "Failed to decrypt key — it may be corrupted",
          });
        }
      }
    }

    const submittedPlayerIds = new Set(
      submissions.map((s: { playerId: string }) => s.playerId)
    );

    // AI players who need to submit (not judge, not already submitted)
    const aiPlayersToSubmit = players.filter(
      (p) =>
        p.isAi &&
        p._id !== round.judgePlayerId &&
        !submittedPlayerIds.has(p._id)
    );

    // Track whether user key failed so we only mark invalid once
    let userKeyFailed = false;

    for (const aiPlayer of aiPlayersToSubmit) {
      if (!aiPlayer.aiPersonaId) continue;

      // Look up persona: first check built-in, then custom
      let persona = AI_PERSONAS[aiPlayer.aiPersonaId] as
        | { name: string; systemPrompt: string; temperature: number }
        | undefined;

      if (!persona) {
        persona = await ctx.runQuery(internal.ai.getCustomPersona, {
          personaId: aiPlayer.aiPersonaId,
        });
      }
      if (!persona) continue;

      let responseText: string;

      // 1) Check cache first — free, no API call
      const cached = await ctx.runQuery(internal.ai.getCachedResponse, {
        promptText: promptCard.text,
        personaId: aiPlayer.aiPersonaId,
      });

      if (cached && cached.responses.length > 0) {
        responseText =
          cached.responses[
            Math.floor(Math.random() * cached.responses.length)
          ];
      } else {
        // 2) Check rate limit before calling the API (skip for BYOK users)
        if (!userApiKey || userKeyFailed) {
          const limited = await isRateLimited(gameId);
          if (limited) {
            responseText = "I'm thinking too hard... my brain hurts.";
          } else {
            // 3) Call OpenAI with default key
            try {
              responseText = await callOpenAI(promptCard.text, persona);
            } catch (err) {
              console.error("OpenAI API error:", err);
              responseText = "My circuits are fried right now.";
            }
          }
        } else {
          // 3) Call OpenAI with user's key (no rate limit)
          try {
            responseText = await callOpenAI(
              promptCard.text,
              persona,
              userApiKey
            );
            // Mark successful usage
            if (userKeyRecord) {
              await ctx.runMutation(internal.apiKeys.markKeyUsed, {
                keyId: userKeyRecord._id,
              });
            }
          } catch (err) {
            console.error("OpenAI API error with user key:", err);
            userKeyFailed = true;

            // Mark the key invalid with a descriptive error
            if (userKeyRecord) {
              const errorMsg = classifyOpenAIError(err);
              await ctx.runMutation(internal.apiKeys.markKeyInvalid, {
                keyId: userKeyRecord._id,
                error: errorMsg,
              });
            }

            // Fall back to default key
            try {
              responseText = await callOpenAI(promptCard.text, persona);
            } catch {
              responseText = "My circuits are fried right now.";
            }
          }
        }

        // 4) Cache the response for future games
        await ctx.runMutation(internal.ai.saveToCache, {
          promptText: promptCard.text,
          personaId: aiPlayer.aiPersonaId,
          response: responseText,
        });
      }

      // 5) Submit (with deduplication built in)
      await ctx.runMutation(internal.ai.submitAiCard, {
        roundId,
        playerId: aiPlayer._id,
        aiGeneratedText: responseText,
      });
    }

    // After all AI submissions, check if round should move to judging
    await ctx.runMutation(internal.ai.checkAndMoveToJudging, {
      roundId,
      gameId,
    });
  },
});

// ---------------------------------------------------------------------------
// AI judging (switched to OpenAI)
// ---------------------------------------------------------------------------
export const judgeSubmissions = action({
  args: {
    promptText: v.string(),
    submissions: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      })
    ),
    judgePersonaId: v.optional(v.string()),
  },
  handler: async (ctx, { promptText, submissions, judgePersonaId }) => {
    const openai = new OpenAI();

    const submissionList = submissions
      .map((s, i) => `${i + 1}. "${s.text}"`)
      .join("\n");

    const systemPrompt = judgePersonaId
      ? AI_PERSONAS[judgePersonaId]?.systemPrompt ||
        "You are a fair and funny judge."
      : "You are a fair and funny judge who appreciates creativity and humor.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nYou are now judging a Cards Against Humanity round. Pick the funniest answer and explain briefly why it's the best.`,
        },
        {
          role: "user",
          content: `The prompt card says: "${promptText}"\n\nThe submissions are:\n${submissionList}\n\nWhich number wins? Reply with just the number first, then a brief explanation.`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (text) {
      const match = text.match(/^(\d+)/);
      if (match) {
        const winnerIndex = parseInt(match[1], 10) - 1;
        if (winnerIndex >= 0 && winnerIndex < submissions.length) {
          return {
            winnerId: submissions[winnerIndex].id,
            explanation: text,
          };
        }
      }
    }

    // Fallback
    return {
      winnerId: submissions[0].id,
      explanation: "I couldn't decide, so I picked the first one!",
    };
  },
});

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------
export const getPersonas = action({
  args: {},
  handler: async () => {
    return Object.entries(AI_PERSONAS).map(([id, persona]) => ({
      id,
      name: persona.name,
    }));
  },
});
