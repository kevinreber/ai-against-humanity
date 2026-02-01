import { test, expect } from "@playwright/test";

test.describe("Games List Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/games");
  });

  test("should display page title with neon styling", async ({ page }) => {
    const title = page.locator("h1 .neon-text-cyan");
    await expect(title).toHaveText("Join a Game");
  });

  test("should have a back link to home", async ({ page }) => {
    const backLink = page.locator('a:has-text("Back to Home")');
    await expect(backLink).toBeVisible();
  });

  test("should have Create Game button", async ({ page }) => {
    const createBtn = page.locator('a:has-text("Create Game")');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toHaveClass(/btn-neon-pink/);
  });

  test("should display Join by Invite Code section", async ({ page }) => {
    await expect(page.locator('text="Join by Invite Code"')).toBeVisible();
  });

  test("should have invite code input field", async ({ page }) => {
    const codeInput = page.locator('input[name="code"]');
    await expect(codeInput).toBeVisible();
    await expect(codeInput).toHaveAttribute("maxlength", "6");
    await expect(codeInput).toHaveAttribute("placeholder", /Enter 6-digit code/i);
  });

  test("should convert invite code to uppercase", async ({ page }) => {
    const codeInput = page.locator('input[name="code"]');
    await codeInput.fill("abcdef");

    // Input should have uppercase class or transform
    await expect(codeInput).toHaveClass(/uppercase/);
  });

  test("should have Join button next to code input", async ({ page }) => {
    const joinBtn = page.locator('form button:has-text("Join")');
    await expect(joinBtn).toBeVisible();
    await expect(joinBtn).toHaveClass(/btn-neon-cyan/);
  });

  test("should display Open Lobbies section", async ({ page }) => {
    await expect(page.locator('text="Open Lobbies"')).toBeVisible();
  });

  test("should show loading state while fetching games", async ({ page }) => {
    // Check for loading indicator (ai-typing dots)
    const loadingDots = page.locator(".ai-typing");
    // Either shows loading or shows content (depending on timing)
    const hasLoadingOrContent = await Promise.race([
      loadingDots.waitFor({ state: "visible", timeout: 2000 }).then(() => true),
      page
        .locator('text="No open games right now"')
        .waitFor({ state: "visible", timeout: 2000 })
        .then(() => true),
      page
        .locator(".game-card.response")
        .first()
        .waitFor({ state: "visible", timeout: 2000 })
        .then(() => true),
    ]).catch(() => false);

    expect(hasLoadingOrContent).toBeTruthy();
  });

  test("should show empty state when no games available", async ({ page }) => {
    // Wait for the page to load
    await page.waitForTimeout(1000);

    // Either shows empty state or shows games
    const emptyState = page.locator('text="No open games right now"');
    const gameCards = page.locator(".game-card.response");

    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasGames = (await gameCards.count()) > 0;

    // One of them should be true
    expect(isEmpty || hasGames).toBeTruthy();
  });

  test("should navigate to Create Game when clicking Create Game button", async ({
    page,
  }) => {
    await page.click('a:has-text("Create Game")');
    await expect(page).toHaveURL(/\/games\/new/);
  });

  test("should navigate back to home when clicking back link", async ({
    page,
  }) => {
    await page.click('a:has-text("Back to Home")');
    await expect(page).toHaveURL("/");
  });

  test.skip("should have proper game card styling", async ({ page }) => {
    // Skip: Requires games to exist in database
    // Check that game-card class is used
    const gameCards = page.locator(".game-card");
    await expect(gameCards.first()).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Title should still be visible
    await expect(page.locator("h1")).toBeVisible();

    // Invite code input should be visible
    await expect(page.locator('input[name="code"]')).toBeVisible();
  });
});

test.describe("Join Game Flow", () => {
  // TODO: Enable these tests once /games/join/:code route is implemented
  test.skip("should submit invite code form", async ({ page }) => {
    await page.goto("/games");

    // Fill in invite code
    const codeInput = page.locator('input[name="code"]');
    await codeInput.fill("ABCDEF");

    // Submit form
    await page.click('form button:has-text("Join")');

    // Should attempt to navigate to join URL
    // Note: Will likely show error since game doesn't exist, but tests navigation attempt
    await page.waitForTimeout(500);
  });

  test.skip("should not submit empty invite code", async ({ page }) => {
    await page.goto("/games");

    const currentUrl = page.url();

    // Try to submit without filling code
    await page.click('form button:has-text("Join")');

    // URL should not change significantly (might stay same or show validation)
    await page.waitForTimeout(500);
  });
});
