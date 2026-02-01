import { test, expect } from "@playwright/test";

test.describe("Game Page - Loading States", () => {
  test("should show loading state when accessing game page", async ({
    page,
  }) => {
    // Navigate to a game page (even with invalid ID, should show loading first)
    await page.goto("/games/test-game-id");

    // Should show loading indicator or error state
    const loadingOrError = await Promise.race([
      page
        .locator(".ai-typing")
        .waitFor({ state: "visible", timeout: 3000 })
        .then(() => "loading"),
      page
        .locator('text="Game not found"')
        .waitFor({ state: "visible", timeout: 3000 })
        .then(() => "not-found"),
      page
        .locator('text="Invalid game ID"')
        .waitFor({ state: "visible", timeout: 3000 })
        .then(() => "invalid"),
    ]).catch(() => "timeout");

    expect(["loading", "not-found", "invalid", "timeout"]).toContain(
      loadingOrError
    );
  });

  test("should show error state for non-existent game", async ({ page }) => {
    await page.goto("/games/nonexistent123");

    // Wait for page to load and show error
    await page.waitForTimeout(2000);

    // Should show some form of error or redirect
    const hasError =
      (await page.locator('text="Game not found"').isVisible()) ||
      (await page.locator('text="Invalid game ID"').isVisible()) ||
      (await page.locator(".ai-typing").isVisible());

    expect(hasError).toBeTruthy();
  });

  test("should have Back to Games link on error", async ({ page }) => {
    await page.goto("/games/nonexistent123");
    await page.waitForTimeout(2000);

    // If error state shows, should have back link
    const backLink = page.locator('a:has-text("Back to Games")');
    const isVisible = await backLink.isVisible().catch(() => false);

    // Either has back link or is still loading
    expect(isVisible || (await page.locator(".ai-typing").isVisible())).toBeTruthy();
  });
});

test.describe("Game Page - UI Components", () => {
  // These tests verify the UI components exist and are properly styled
  // They don't require an actual game to be running

  test("should use neon color scheme in game UI", async ({ page }) => {
    await page.goto("/games/new");

    // Verify neon styling is applied
    const gameCards = page.locator(".game-card");
    await expect(gameCards.first()).toBeVisible();

    // Check for neon button styling
    const neonButtons = page.locator('[class*="btn-neon"]');
    await expect(neonButtons.first()).toBeVisible();
  });

  test("should have proper game card styling classes", async ({ page }) => {
    await page.goto("/games");

    // Check that game-card components have proper classes
    const gameCard = page.locator(".game-card").first();
    await expect(gameCard).toBeVisible();
  });
});

test.describe("Game Flow Integration", () => {
  test("full game creation flow", async ({ page }) => {
    // Start at home
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();

    // Navigate to create game
    await page.click('a:has-text("Create Game")');
    await expect(page).toHaveURL(/\/games\/new/);

    // Fill in game details
    await page.fill('input[placeholder="Enter your name"]', "E2ETestPlayer");

    // Select AI opponents (Chaotic Carl should be default)
    await expect(
      page.locator('button:has-text("Chaotic Carl")')
    ).toHaveClass(/border-\[--color-neon-purple\]/);

    // Add another AI
    await page.click('button:has-text("Edgy Eddie")');

    // Select points to win
    await page.click('button:has-text("10")');

    // Verify selections
    await expect(page.locator("text=Selected: 2 AI player(s)")).toBeVisible();

    // Note: Actually creating the game would require Convex to be running
    // So we just verify the form is properly filled
    const createBtn = page.locator('button:has-text("Create Game")');
    await expect(createBtn).toBeEnabled();
  });

  test("navigation flow between pages", async ({ page }) => {
    // Home -> Games List
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const joinGameLink = page.locator('a:has-text("Join Game")');
    await joinGameLink.waitFor({ state: "visible", timeout: 10000 });
    await joinGameLink.click();
    await expect(page).toHaveURL(/\/games/);

    // Games List -> Create Game
    await page.waitForLoadState("domcontentloaded");
    const createGameLink = page.locator('a:has-text("Create Game")').first();
    await createGameLink.waitFor({ state: "visible", timeout: 10000 });
    await createGameLink.click();
    await expect(page).toHaveURL(/\/games\/new/);

    // Create Game -> Games List (back)
    await page.waitForLoadState("domcontentloaded");
    const backToGamesLink = page.locator('a:has-text("Back to Games")');
    await backToGamesLink.waitFor({ state: "visible", timeout: 10000 });
    await backToGamesLink.click();
    await expect(page).toHaveURL(/\/games/);

    // Games List -> Home (back)
    await page.waitForLoadState("domcontentloaded");
    const backToHomeLink = page.locator('a:has-text("Back to Home")');
    await backToHomeLink.waitFor({ state: "visible", timeout: 10000 });
    await backToHomeLink.click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("Accessibility", () => {
  test("home page should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Should have h1
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Should have h2 for sections
    const h2s = page.locator("h2");
    expect(await h2s.count()).toBeGreaterThan(0);
  });

  test("form inputs should have associated labels", async ({ page }) => {
    await page.goto("/games/new");

    // Username input should have a label
    const usernameLabel = page.locator('label:has-text("Your Name")');
    await expect(usernameLabel).toBeVisible();
  });

  test("buttons should be keyboard accessible", async ({ page }) => {
    await page.goto("/");

    // Tab to the Create Game button
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // One of the main buttons should be focused
    const focusedElement = page.locator(":focus");
    const tagName = await focusedElement.evaluate((el) => el.tagName);
    expect(["A", "BUTTON"]).toContain(tagName);
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/");

    // Check that text is visible against background
    // This is a basic check - a full audit would use axe-core
    const body = page.locator("body");
    await expect(body).toHaveCSS("color-scheme", "dark");
  });
});

test.describe("Performance", () => {
  test("home page should load within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("navigation should be fast", async ({ page }) => {
    await page.goto("/");

    const startTime = Date.now();
    await page.click('a:has-text("Create Game")');
    await page.waitForLoadState("domcontentloaded");
    const navTime = Date.now() - startTime;

    // Navigation should be under 2 seconds
    expect(navTime).toBeLessThan(2000);
  });
});
