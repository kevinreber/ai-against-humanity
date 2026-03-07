/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  actionGeneric,
  httpActionGeneric,
  queryGeneric,
  mutationGeneric,
} from "convex/server";

/**
 * Define a query in this Convex app's public API.
 */
export const query = queryGeneric;

/**
 * Define a query that is only accessible from other Convex functions.
 */
export const internalQuery = queryGeneric;

/**
 * Define a mutation in this Convex app's public API.
 */
export const mutation = mutationGeneric;

/**
 * Define a mutation that is only accessible from other Convex functions.
 */
export const internalMutation = mutationGeneric;

/**
 * Define an action in this Convex app's public API.
 */
export const action = actionGeneric;

/**
 * Define an action that is only accessible from other Convex functions.
 */
export const internalAction = actionGeneric;

/**
 * Define an HTTP action.
 */
export const httpAction = httpActionGeneric;
