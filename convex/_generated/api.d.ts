/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiPersonas from "../aiPersonas.js";
import type * as aiQueries from "../aiQueries.js";
import type * as apiKeyQueries from "../apiKeyQueries.js";
import type * as apiKeys from "../apiKeys.js";
import type * as cards from "../cards.js";
import type * as customPersonas from "../customPersonas.js";
import type * as encryption from "../encryption.js";
import type * as gameConstants from "../gameConstants.js";
import type * as games from "../games.js";
import type * as rateLimit from "../rateLimit.js";
import type * as rounds from "../rounds.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiPersonas: typeof aiPersonas;
  aiQueries: typeof aiQueries;
  apiKeyQueries: typeof apiKeyQueries;
  apiKeys: typeof apiKeys;
  cards: typeof cards;
  customPersonas: typeof customPersonas;
  encryption: typeof encryption;
  gameConstants: typeof gameConstants;
  games: typeof games;
  rateLimit: typeof rateLimit;
  rounds: typeof rounds;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
