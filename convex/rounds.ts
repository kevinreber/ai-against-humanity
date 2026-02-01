import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Query: Get round with submissions
export const getRound = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) return null;

    const promptCard = await ctx.db.get(round.promptCardId);
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();

    const submissionsWithDetails = await Promise.all(
      submissions.map(async (sub) => {
        const player = await ctx.db.get(sub.playerId);
        const card = sub.cardId ? await ctx.db.get(sub.cardId) : null;
        return {
          ...sub,
          player,
          cardText: card?.text ?? sub.aiGeneratedText ?? "",
        };
      })
    );

    return {
      round,
      promptCard,
      submissions: submissionsWithDetails,
    };
  },
});

// Query: Get all submissions for a round (anonymous for judging)
export const getSubmissionsForJudging = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();

    // Shuffle submissions for anonymous judging
    const shuffled = [...submissions].sort(() => Math.random() - 0.5);

    return Promise.all(
      shuffled.map(async (sub) => {
        const card = sub.cardId ? await ctx.db.get(sub.cardId) : null;
        return {
          _id: sub._id,
          playerId: sub.playerId,
          text: card?.text ?? sub.aiGeneratedText ?? "",
        };
      })
    );
  },
});

// Query: Get round history for a game
export const getRoundHistory = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .filter((q) => q.eq(q.field("status"), "complete"))
      .collect();

    return Promise.all(
      rounds.map(async (round) => {
        const promptCard = await ctx.db.get(round.promptCardId);
        const winner = round.winnerPlayerId
          ? await ctx.db.get(round.winnerPlayerId)
          : null;
        const winningSubmission = round.winnerPlayerId
          ? await ctx.db
              .query("submissions")
              .withIndex("by_round", (q) => q.eq("roundId", round._id))
              .filter((q) => q.eq(q.field("playerId"), round.winnerPlayerId))
              .first()
          : null;

        let winningText = "";
        if (winningSubmission) {
          if (winningSubmission.cardId) {
            const card = await ctx.db.get(winningSubmission.cardId);
            winningText = card?.text ?? "";
          } else {
            winningText = winningSubmission.aiGeneratedText ?? "";
          }
        }

        return {
          roundNumber: round.roundNumber,
          promptText: promptCard?.text ?? "",
          winner,
          winningText,
        };
      })
    );
  },
});

// Internal mutation: Auto-timeout for submissions
export const autoTimeout = internalMutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) return;

    // Only timeout if still in submitting phase
    if (round.status === "submitting") {
      await ctx.db.patch(roundId, { status: "judging" });
    }
  },
});

// Internal mutation: Auto-judge timeout
export const autoJudgeTimeout = internalMutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) return;

    // Only timeout if still in judging phase
    if (round.status === "judging") {
      // Pick a random winner
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_round", (q) => q.eq("roundId", roundId))
        .collect();

      if (submissions.length > 0) {
        const randomWinner =
          submissions[Math.floor(Math.random() * submissions.length)];
        await ctx.db.patch(roundId, {
          winnerPlayerId: randomWinner.playerId,
          status: "complete",
        });

        // Update player score
        const player = await ctx.db.get(randomWinner.playerId);
        if (player) {
          await ctx.db.patch(randomWinner.playerId, {
            score: player.score + 1,
          });
        }
      }
    }
  },
});

// Mutation: Start round with timeouts
export const startRoundWithTimeout = mutation({
  args: { gameId: v.id("games"), timeoutSeconds: v.number() },
  handler: async (ctx, { gameId, timeoutSeconds }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");

    const currentRound = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_round", (q) =>
        q.eq("gameId", gameId).eq("roundNumber", game.currentRound)
      )
      .first();

    if (!currentRound) throw new Error("No current round");

    // Schedule auto-timeout
    await ctx.scheduler.runAfter(
      timeoutSeconds * 1000,
      internal.rounds.autoTimeout,
      { roundId: currentRound._id }
    );

    return currentRound._id;
  },
});

// Mutation: Check if all submissions are in
export const checkAllSubmissions = mutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round) return { allIn: false };

    const game = await ctx.db.get(round.gameId);
    if (!game) return { allIn: false };

    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_game", (q) => q.eq("gameId", game._id))
      .collect();

    const nonJudgePlayers = players.filter((p) => !p.isJudge);

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect();

    const allIn = submissions.length >= nonJudgePlayers.length;

    if (allIn && round.status === "submitting") {
      await ctx.db.patch(roundId, { status: "judging" });
    }

    return { allIn, submissionCount: submissions.length, expectedCount: nonJudgePlayers.length };
  },
});
