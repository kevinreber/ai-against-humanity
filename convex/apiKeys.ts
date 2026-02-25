"use node";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";
import { encrypt, decrypt } from "./encryption";

// ---------------------------------------------------------------------------
// Internal helpers (used by AI service)
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

// ---------------------------------------------------------------------------
// Public queries (for UI)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Actions (can access process.env, make external API calls)
// ---------------------------------------------------------------------------

/** Classify an OpenAI error into a user-friendly message */
function classifyOpenAIError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("401") || message.includes("invalid_api_key")) {
    return "Invalid or revoked API key";
  }
  if (message.includes("429")) {
    return "Rate limit exceeded on your API key";
  }
  if (message.includes("403")) {
    return "API key does not have required permissions";
  }
  if (message.includes("insufficient_quota")) {
    return "API key has exhausted its quota";
  }
  if (message.includes("billing")) {
    return "Billing issue with your API account";
  }
  return `API error: ${message.slice(0, 100)}`;
}

/** Validate and save an API key */
export const saveApiKey = action({
  args: {
    userId: v.id("users"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    apiKey: v.string(),
  },
  handler: async (ctx, { userId, provider, apiKey }) => {
    // 1) Verify user exists
    const user = await ctx.runQuery(internal.apiKeys.verifyUser, { userId });
    if (!user) {
      throw new Error("User not found. Please create a game first.");
    }

    // 2) Basic format validation
    if (provider === "openai" && !apiKey.startsWith("sk-")) {
      throw new Error("Invalid OpenAI API key format. Keys start with 'sk-'.");
    }

    // 3) Validate the key by making a lightweight API call
    if (provider === "openai") {
      try {
        const openai = new OpenAI({ apiKey });
        await openai.models.list();
      } catch (err: unknown) {
        throw new Error(classifyOpenAIError(err));
      }
    }

    // 4) Encrypt the key
    const encryptedKey = encrypt(apiKey);
    const keyHint = `...${apiKey.slice(-4)}`;

    // 5) Store it
    await ctx.runMutation(internal.apiKeys.storeEncryptedKey, {
      userId,
      provider,
      encryptedKey,
      keyHint,
    });

    return { success: true, keyHint };
  },
});

/** Delete a user's API key */
export const deleteApiKey = action({
  args: {
    userId: v.id("users"),
    keyId: v.id("userApiKeys"),
  },
  handler: async (ctx, { userId, keyId }) => {
    // Verify user exists
    const user = await ctx.runQuery(internal.apiKeys.verifyUser, { userId });
    if (!user) {
      throw new Error("User not found.");
    }

    // Verify ownership via internal query
    const key = await ctx.runQuery(internal.apiKeys.getEncryptedKey, {
      userId,
      provider: "openai",
    });

    if (!key || key._id !== keyId) {
      // Try anthropic
      const anthropicKey = await ctx.runQuery(
        internal.apiKeys.getEncryptedKey,
        { userId, provider: "anthropic" }
      );
      if (!anthropicKey || anthropicKey._id !== keyId) {
        throw new Error("API key not found or not owned by this user.");
      }
    }

    await ctx.runMutation(internal.apiKeys.removeKey, { keyId });
    return { success: true };
  },
});

/** Internal mutation to delete a key */
export const removeKey = internalMutation({
  args: { keyId: v.id("userApiKeys") },
  handler: async (ctx, { keyId }) => {
    await ctx.db.delete(keyId);
  },
});

/**
 * Decrypt a user's API key for use in AI generation.
 * Only called from other server-side actions — never exposed to client.
 */
export function decryptApiKey(encryptedKey: string): string {
  return decrypt(encryptedKey);
}

/** Exported for use in ai.ts to classify errors during gameplay */
export { classifyOpenAIError };
