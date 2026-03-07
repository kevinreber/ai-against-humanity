"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";
import { encrypt, decrypt } from "./encryption";

// ---------------------------------------------------------------------------
// Actions (require Node.js for crypto + external API calls)
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
    const user = await ctx.runQuery(internal.apiKeyQueries.verifyUser, { userId });
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
    await ctx.runMutation(internal.apiKeyQueries.storeEncryptedKey, {
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
    const user = await ctx.runQuery(internal.apiKeyQueries.verifyUser, { userId });
    if (!user) {
      throw new Error("User not found.");
    }

    // Verify ownership via internal query
    const key = await ctx.runQuery(internal.apiKeyQueries.getEncryptedKey, {
      userId,
      provider: "openai",
    });

    if (!key || key._id !== keyId) {
      // Try anthropic
      const anthropicKey = await ctx.runQuery(
        internal.apiKeyQueries.getEncryptedKey,
        { userId, provider: "anthropic" }
      );
      if (!anthropicKey || anthropicKey._id !== keyId) {
        throw new Error("API key not found or not owned by this user.");
      }
    }

    await ctx.runMutation(internal.apiKeyQueries.removeKey, { keyId });
    return { success: true };
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
