import { test, expect, type Page } from "@playwright/test";

// Base64-encoded u64 timestamps for Convex protocol
const TS_0 = "AAAAAAAAAAA="; // Long(0)
const TS_1 = "AQAAAAAAAAA="; // Long(1)

const MOCK_HOST_ID = "jh7test_host_user_123";
const MOCK_GAME_ID = "jh7test_game_456";

function createMockGameState(hostId: string) {
  return {
    game: {
      _id: MOCK_GAME_ID,
      _creationTime: Date.now(),
      hostId,
      status: "lobby",
      inviteCode: "TESTXY",
      currentRound: 0,
      pointsToWin: 7,
      gameMode: "human-vs-ai",
      maxPlayers: 8,
    },
    players: [
      {
        _id: "player_host",
        _creationTime: Date.now(),
        gameId: MOCK_GAME_ID,
        userId: hostId,
        name: "TestHost",
        score: 0,
        isAi: false,
        isJudge: false,
        hand: [],
      },
      {
        _id: "player_ai_1",
        _creationTime: Date.now(),
        gameId: MOCK_GAME_ID,
        name: "Chaotic Carl",
        score: 0,
        isAi: true,
        isJudge: false,
        hand: [],
        aiPersonaId: "chaotic-carl",
      },
    ],
    currentRound: null,
    promptCard: null,
  };
}

/**
 * Mock the Convex WebSocket protocol to return controlled game state.
 *
 * The Convex client communicates over WebSocket using JSON messages:
 * - Client sends: Connect, Authenticate, ModifyQuerySet, Mutation
 * - Server responds: Transition (with query results), MutationResponse
 */
async function setupConvexMock(page: Page, gameState: ReturnType<typeof createMockGameState>) {
  await page.routeWebSocket(/\.convex\.cloud/, (ws) => {
    let identityVersion = 0;

    ws.onMessage((msg) => {
      if (typeof msg !== "string") return;

      let message: Record<string, unknown>;
      try {
        message = JSON.parse(msg);
      } catch {
        return;
      }

      switch (message.type) {
        case "Connect": {
          // Acknowledge connection with an empty transition
          ws.send(
            JSON.stringify({
              type: "Transition",
              startVersion: { querySet: 0, ts: TS_0, identity: 0 },
              endVersion: { querySet: 0, ts: TS_0, identity: 0 },
              modifications: [],
            })
          );
          break;
        }

        case "Authenticate": {
          const baseIdentity = (message.baseVersion as number) ?? identityVersion;
          identityVersion = baseIdentity + 1;
          ws.send(
            JSON.stringify({
              type: "Transition",
              startVersion: { querySet: 0, ts: TS_0, identity: baseIdentity },
              endVersion: { querySet: 0, ts: TS_0, identity: identityVersion },
              modifications: [],
            })
          );
          break;
        }

        case "ModifyQuerySet": {
          const mods = message.modifications as Array<Record<string, unknown>>;
          const baseVersion = message.baseVersion as number;
          const newVersion = message.newVersion as number;

          const queryResults: Array<Record<string, unknown>> = [];

          for (const mod of mods) {
            if (mod.type !== "Add") continue;

            const udfPath = mod.udfPath as string;
            let value: unknown = undefined;

            if (udfPath.includes("getGame")) {
              value = gameState;
            } else if (udfPath.includes("getSubmissions")) {
              value = [];
            } else if (udfPath.includes("getMyApiKeys")) {
              value = [];
            }

            if (value !== undefined) {
              queryResults.push({
                type: "QueryUpdated",
                queryId: mod.queryId,
                value,
                logLines: [],
                journal: null,
              });
            }
          }

          ws.send(
            JSON.stringify({
              type: "Transition",
              startVersion: { querySet: baseVersion, ts: TS_0, identity: identityVersion },
              endVersion: { querySet: newVersion, ts: TS_1, identity: identityVersion },
              modifications: queryResults,
            })
          );
          break;
        }
      }
    });
  });

  // Block any HTTP fallback requests to Convex
  await page.route(/\.convex\.cloud/, (route) => route.abort());
}

test.describe("Game Lobby - Host Start Button", () => {
  test("host should see Start Game button in lobby", async ({ page }) => {
    const gameState = createMockGameState(MOCK_HOST_ID);

    // Set localStorage userId to match the host before page loads
    await page.addInitScript((hostId: string) => {
      localStorage.setItem("userId", hostId);
    }, MOCK_HOST_ID);

    await setupConvexMock(page, gameState);
    await page.goto(`/games/${MOCK_GAME_ID}`);

    // Host should see the Start Game button
    const startBtn = page.locator('button:has-text("Start Game")');
    await expect(startBtn).toBeVisible({ timeout: 10000 });

    // Should NOT see the waiting message
    await expect(
      page.locator('text="Waiting for host to start the game..."')
    ).not.toBeVisible();
  });

  test("non-host should see waiting message instead of Start Game", async ({
    page,
  }) => {
    const gameState = createMockGameState(MOCK_HOST_ID);

    // Set localStorage to a different userId (not the host)
    await page.addInitScript(() => {
      localStorage.setItem("userId", "different_user_999");
    });

    await setupConvexMock(page, gameState);
    await page.goto(`/games/${MOCK_GAME_ID}`);

    // Non-host should see the waiting message
    await expect(
      page.locator('text="Waiting for host to start the game..."')
    ).toBeVisible({ timeout: 10000 });

    // Should NOT see the Start Game button
    await expect(
      page.locator('button:has-text("Start Game")')
    ).not.toBeVisible();
  });

  test("lobby should display game invite code", async ({ page }) => {
    const gameState = createMockGameState(MOCK_HOST_ID);

    await page.addInitScript((hostId: string) => {
      localStorage.setItem("userId", hostId);
    }, MOCK_HOST_ID);

    await setupConvexMock(page, gameState);
    await page.goto(`/games/${MOCK_GAME_ID}`);

    await expect(page.locator("text=TESTXY")).toBeVisible({ timeout: 10000 });
  });

  test("lobby should display player list", async ({ page }) => {
    const gameState = createMockGameState(MOCK_HOST_ID);

    await page.addInitScript((hostId: string) => {
      localStorage.setItem("userId", hostId);
    }, MOCK_HOST_ID);

    await setupConvexMock(page, gameState);
    await page.goto(`/games/${MOCK_GAME_ID}`);

    // The host player shows as "Player" (username isn't stored on gamePlayers)
    // and the AI player shows by persona name
    await expect(page.getByText("Player", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Chaotic Carl")).toBeVisible();
  });

  test("Start Game button should be disabled with fewer than 2 players", async ({
    page,
  }) => {
    // Create game state with only 1 player (the host)
    const gameState = createMockGameState(MOCK_HOST_ID);
    gameState.players = [gameState.players[0]];

    await page.addInitScript((hostId: string) => {
      localStorage.setItem("userId", hostId);
    }, MOCK_HOST_ID);

    await setupConvexMock(page, gameState);
    await page.goto(`/games/${MOCK_GAME_ID}`);

    // Button should show but be disabled
    const btn = page.locator('button:has-text("Need at least 2 players")');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await expect(btn).toBeDisabled();
  });
});
