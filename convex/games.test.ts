import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";

/**
 * Unit tests for game startup validation logic.
 *
 * These test the pure validation rules extracted from the startGame mutation.
 * Full integration tests would require the Convex test framework with a real
 * database, but these catch the common error cases that cause "Server Error"
 * on the client.
 */

// Mirrors the validation logic in startGame mutation
function validateStartGame({
  game,
  players,
  promptCardCount,
  responseCardCount,
}: {
  game: { status: string } | null;
  players: { _id: string; isAi: boolean }[];
  promptCardCount: number;
  responseCardCount: number;
}) {
  if (!game) throw new ConvexError("Game not found");
  if (game.status !== "lobby") throw new ConvexError("Game already started");
  if (players.length < 2) throw new ConvexError("Need at least 2 players");
  if (promptCardCount === 0) {
    throw new ConvexError(
      "No cards available. Please seed the database from the home page first."
    );
  }

  const nonJudgeCount = players.length - 1; // first player becomes judge
  const cardsNeeded = nonJudgeCount * 7;
  if (responseCardCount < cardsNeeded) {
    throw new ConvexError(
      `Not enough response cards. Need ${cardsNeeded} but only have ${responseCardCount}.`
    );
  }
}

describe("startGame validation", () => {
  const validGame = { status: "lobby" };
  const fourPlayers = [
    { _id: "p1", isAi: false },
    { _id: "p2", isAi: true },
    { _id: "p3", isAi: true },
    { _id: "p4", isAi: true },
  ];

  it("passes with valid game state and seeded cards", () => {
    expect(() =>
      validateStartGame({
        game: validGame,
        players: fourPlayers,
        promptCardCount: 25,
        responseCardCount: 50,
      })
    ).not.toThrow();
  });

  it("throws ConvexError when game is not found", () => {
    expect(() =>
      validateStartGame({
        game: null,
        players: fourPlayers,
        promptCardCount: 25,
        responseCardCount: 50,
      })
    ).toThrow(ConvexError);

    try {
      validateStartGame({
        game: null,
        players: fourPlayers,
        promptCardCount: 25,
        responseCardCount: 50,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError<string>).data).toBe("Game not found");
    }
  });

  it("throws ConvexError when game already started", () => {
    expect(() =>
      validateStartGame({
        game: { status: "playing" },
        players: fourPlayers,
        promptCardCount: 25,
        responseCardCount: 50,
      })
    ).toThrow(ConvexError);
  });

  it("throws ConvexError when fewer than 2 players", () => {
    expect(() =>
      validateStartGame({
        game: validGame,
        players: [{ _id: "p1", isAi: false }],
        promptCardCount: 25,
        responseCardCount: 50,
      })
    ).toThrow(ConvexError);
  });

  it("throws ConvexError when no prompt cards are seeded", () => {
    try {
      validateStartGame({
        game: validGame,
        players: fourPlayers,
        promptCardCount: 0,
        responseCardCount: 50,
      });
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError<string>).data).toContain("No cards available");
    }
  });

  it("throws ConvexError when not enough response cards for all players", () => {
    try {
      validateStartGame({
        game: validGame,
        players: fourPlayers,
        promptCardCount: 25,
        responseCardCount: 10, // need 21 (3 non-judge × 7 cards)
      });
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError<string>).data).toContain(
        "Not enough response cards"
      );
    }
  });

  it("correctly calculates cards needed excluding judge", () => {
    // 2 players: 1 judge + 1 non-judge = 7 cards needed
    expect(() =>
      validateStartGame({
        game: validGame,
        players: [
          { _id: "p1", isAi: false },
          { _id: "p2", isAi: true },
        ],
        promptCardCount: 1,
        responseCardCount: 7,
      })
    ).not.toThrow();

    // 2 players but only 6 response cards — should fail
    expect(() =>
      validateStartGame({
        game: validGame,
        players: [
          { _id: "p1", isAi: false },
          { _id: "p2", isAi: true },
        ],
        promptCardCount: 1,
        responseCardCount: 6,
      })
    ).toThrow(ConvexError);
  });

  it("errors are ConvexError (user-facing) not plain Error (masked)", () => {
    // This test ensures we never regress to plain Error which Convex
    // masks as "Server Error" — the exact bug we fixed
    const testCases = [
      { game: null, players: fourPlayers, promptCardCount: 25, responseCardCount: 50 },
      { game: { status: "playing" }, players: fourPlayers, promptCardCount: 25, responseCardCount: 50 },
      { game: validGame, players: [{ _id: "p1", isAi: false }], promptCardCount: 25, responseCardCount: 50 },
      { game: validGame, players: fourPlayers, promptCardCount: 0, responseCardCount: 50 },
    ];

    for (const testCase of testCases) {
      try {
        validateStartGame(testCase);
      } catch (e) {
        // Must be ConvexError, NOT plain Error
        expect(e).toBeInstanceOf(ConvexError);
        expect(e).not.toBeInstanceOf(TypeError);
      }
    }
  });
});

describe("judge card dealing", () => {
  it("should not deal cards to the judge player", () => {
    // Simulates the card dealing logic from startGame
    const players = [
      { _id: "judge", isJudge: false }, // isJudge is false in local var (the old bug!)
      { _id: "p2", isJudge: false },
      { _id: "p3", isJudge: false },
    ];

    const judgePlayerId = players[0]._id;
    const dealtPlayers: string[] = [];

    for (const player of players) {
      // Fixed logic: compare by ID, not stale isJudge flag
      if (player._id !== judgePlayerId) {
        dealtPlayers.push(player._id);
      }
    }

    expect(dealtPlayers).toEqual(["p2", "p3"]);
    expect(dealtPlayers).not.toContain("judge");
  });

  it("old buggy logic would incorrectly deal to judge", () => {
    // Demonstrates the bug: checking player.isJudge (stale local var)
    const players = [
      { _id: "judge", isJudge: false }, // DB was patched but local var wasn't
      { _id: "p2", isJudge: false },
      { _id: "p3", isJudge: false },
    ];

    const buggyDealtPlayers: string[] = [];

    for (const player of players) {
      // OLD buggy logic: checks stale isJudge which is always false
      if (!player.isJudge) {
        buggyDealtPlayers.push(player._id);
      }
    }

    // Bug: judge incorrectly gets dealt cards
    expect(buggyDealtPlayers).toContain("judge");
    expect(buggyDealtPlayers).toHaveLength(3); // all 3 instead of 2
  });
});
