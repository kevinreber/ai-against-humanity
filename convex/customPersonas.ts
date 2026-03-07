import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const MAX_CUSTOM_PERSONAS_PER_USER = 10;
const MIN_TEMPERATURE = 0.1;
const MAX_TEMPERATURE = 1.2;

// Base system prompt wrapper to prevent prompt injection and enforce game format
const SYSTEM_PROMPT_WRAPPER = `You are playing a Cards Against Humanity style game. Respond with ONLY your card answer, nothing else. Keep it to one short sentence or phrase. Do not include any explanations, disclaimers, or meta-commentary.

Your personality: `;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get all custom personas created by a specific user */
export const getMyPersonas = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("customPersonas")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();
  },
});

/** Get all public custom personas (for browsing in game lobby) */
export const getPublicPersonas = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("customPersonas")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();
  },
});

/** Get a single persona by ID */
export const getPersona = query({
  args: { personaId: v.id("customPersonas") },
  handler: async (ctx, { personaId }) => {
    return ctx.db.get(personaId);
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new custom AI persona */
export const createPersona = mutation({
  args: {
    creatorId: v.id("users"),
    name: v.string(),
    personality: v.string(),
    systemPrompt: v.string(),
    temperature: v.number(),
    emoji: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.creatorId);
    if (!user) {
      throw new Error("User not found. Please create a game first.");
    }

    // Enforce per-user limit
    const existing = await ctx.db
      .query("customPersonas")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .collect();

    if (existing.length >= MAX_CUSTOM_PERSONAS_PER_USER) {
      throw new Error(
        `Maximum of ${MAX_CUSTOM_PERSONAS_PER_USER} custom personas per user`
      );
    }

    // Validate inputs
    if (args.name.trim().length < 1 || args.name.length > 30) {
      throw new Error("Name must be 1-30 characters");
    }
    if (args.personality.trim().length < 1 || args.personality.length > 100) {
      throw new Error("Personality description must be 1-100 characters");
    }
    if (args.systemPrompt.trim().length < 10 || args.systemPrompt.length > 500) {
      throw new Error("System prompt must be 10-500 characters");
    }
    if (args.temperature < MIN_TEMPERATURE || args.temperature > MAX_TEMPERATURE) {
      throw new Error(
        `Temperature must be between ${MIN_TEMPERATURE} and ${MAX_TEMPERATURE}`
      );
    }

    // Wrap the user's prompt with our guardrails
    const wrappedPrompt = SYSTEM_PROMPT_WRAPPER + args.systemPrompt;

    return ctx.db.insert("customPersonas", {
      creatorId: args.creatorId,
      name: args.name.trim(),
      personality: args.personality.trim(),
      systemPrompt: wrappedPrompt,
      temperature: args.temperature,
      emoji: args.emoji || "🤖",
      isPublic: args.isPublic,
    });
  },
});

/** Update an existing custom persona (only by the creator) */
export const updatePersona = mutation({
  args: {
    personaId: v.id("customPersonas"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    personality: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    temperature: v.optional(v.number()),
    emoji: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, { personaId, userId, ...updates }) => {
    const persona = await ctx.db.get(personaId);
    if (!persona) throw new Error("Persona not found");
    if (persona.creatorId !== userId) {
      throw new Error("You can only edit your own personas");
    }

    const patch: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      if (updates.name.trim().length < 1 || updates.name.length > 30) {
        throw new Error("Name must be 1-30 characters");
      }
      patch.name = updates.name.trim();
    }
    if (updates.personality !== undefined) {
      if (
        updates.personality.trim().length < 1 ||
        updates.personality.length > 100
      ) {
        throw new Error("Personality description must be 1-100 characters");
      }
      patch.personality = updates.personality.trim();
    }
    if (updates.systemPrompt !== undefined) {
      if (
        updates.systemPrompt.trim().length < 10 ||
        updates.systemPrompt.length > 500
      ) {
        throw new Error("System prompt must be 10-500 characters");
      }
      patch.systemPrompt = SYSTEM_PROMPT_WRAPPER + updates.systemPrompt;
    }
    if (updates.temperature !== undefined) {
      if (
        updates.temperature < MIN_TEMPERATURE ||
        updates.temperature > MAX_TEMPERATURE
      ) {
        throw new Error(
          `Temperature must be between ${MIN_TEMPERATURE} and ${MAX_TEMPERATURE}`
        );
      }
      patch.temperature = updates.temperature;
    }
    if (updates.emoji !== undefined) patch.emoji = updates.emoji;
    if (updates.isPublic !== undefined) patch.isPublic = updates.isPublic;

    await ctx.db.patch(personaId, patch);
  },
});

/** Delete a custom persona (only by the creator) */
export const deletePersona = mutation({
  args: {
    personaId: v.id("customPersonas"),
    userId: v.id("users"),
  },
  handler: async (ctx, { personaId, userId }) => {
    const persona = await ctx.db.get(personaId);
    if (!persona) throw new Error("Persona not found");
    if (persona.creatorId !== userId) {
      throw new Error("You can only delete your own personas");
    }

    await ctx.db.delete(personaId);
  },
});
