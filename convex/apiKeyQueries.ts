import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Queries & mutations for API key management.
// These MUST live outside "use node" files — Convex only allows actions in
// Node.js runtime modules.
// ---------------------------------------------------------------------------

/** Verify a user exists in the database */
export const verifyUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db.get(userId);
  },
});

/** Get the encrypted key for a user+provider (internal use only) */
export const getEncryptedKey = internalQuery({
  args: {
    userId: v.id("users"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
  },
  handler: async (ctx, { userId, provider }) => {
    return ctx.db
      .query("userApiKeys")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", userId).eq("provider", provider)
      )
      .first();
  },
});

/** Store an encrypted API key */
export const storeEncryptedKey = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    encryptedKey: v.string(),
    keyHint: v.string(),
  },
  handler: async (ctx, { userId, provider, encryptedKey, keyHint }) => {
    // Remove existing key for this user+provider
    const existing = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", userId).eq("provider", provider)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return ctx.db.insert("userApiKeys", {
      userId,
      provider,
      encryptedKey,
      keyHint,
      isValid: true,
      createdAt: Date.now(),
    });
  },
});

/** Mark a key as invalid with error details (e.g., when it fails during gameplay) */
export const markKeyInvalid = internalMutation({
  args: {
    keyId: v.id("userApiKeys"),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { keyId, error }) => {
    await ctx.db.patch(keyId, {
      isValid: false,
      lastError: error || "Key validation failed",
      lastErrorAt: Date.now(),
    });
  },
});

/** Record successful key usage */
export const markKeyUsed = internalMutation({
  args: { keyId: v.id("userApiKeys") },
  handler: async (ctx, { keyId }) => {
    await ctx.db.patch(keyId, { lastUsed: Date.now() });
  },
});

/** Get API key info for a user (never returns the actual key) */
export const getMyApiKeys = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const keys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Strip encrypted key — only return display info
    return keys.map((k) => ({
      _id: k._id,
      provider: k.provider,
      keyHint: k.keyHint,
      isValid: k.isValid,
      createdAt: k.createdAt,
      lastUsed: k.lastUsed,
      lastError: k.lastError,
      lastErrorAt: k.lastErrorAt,
    }));
  },
});

/** Internal mutation to delete a key */
export const removeKey = internalMutation({
  args: { keyId: v.id("userApiKeys") },
  handler: async (ctx, { keyId }) => {
    await ctx.db.delete(keyId);
  },
});
