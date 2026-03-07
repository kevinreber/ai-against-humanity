/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as aiPersonas from "../aiPersonas.js";
import type * as cards from "../cards.js";
import type * as games from "../games.js";
import type * as rateLimit from "../rateLimit.js";
import type * as rounds from "../rounds.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiPersonas: typeof aiPersonas;
  cards: typeof cards;
  games: typeof games;
  rateLimit: typeof rateLimit;
  rounds: typeof rounds;
  seed: typeof seed;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
