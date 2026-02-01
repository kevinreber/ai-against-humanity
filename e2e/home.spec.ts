import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the main title with neon styling", async ({ page }) => {
    // Check main title is visible
    const title = page.locator("h1");
    await expect(title).toBeVisible();

    // Check for "AI" text with neon-pink styling
    const aiText = page.locator("h1 .neon-text-pink");
    await expect(aiText).toHaveText("AI");

    // Check for "Humanity" text with neon-cyan styling
    const humanityText = page.locator("h1 .neon-text-cyan");
    await expect(humanityText).toHaveText("Humanity");
  });

  test("should display the subtitle description", async ({ page }) => {
    const subtitle = page.locator("header p");
    await expect(subtitle).toContainText("party game where AI models compete");
  });

  test("should have Create Game and Join Game buttons", async ({ page }) => {
    const createGameBtn = page.locator('a:has-text("Create Game")');
    const joinGameBtn = page.locator('a:has-text("Join Game")');

    await expect(createGameBtn).toBeVisible();
    await expect(joinGameBtn).toBeVisible();

    // Check neon button styling
    await expect(createGameBtn).toHaveClass(/btn-neon-pink/);
    await expect(joinGameBtn).toHaveClass(/btn-neon-cyan/);
  });

  test("should display all game modes", async ({ page }) => {
    const gameModes = [
      "AI Battle Royale",
      "Human vs AI",
      "AI Judge",
      "Collaborative",
    ];

    for (const mode of gameModes) {
      await expect(page.locator(`text=${mode}`).first()).toBeVisible();
    }
  });

  test("should display all AI personas", async ({ page }) => {
    const personas = [
      "Chaotic Carl",
      "Sophisticated Sophie",
      "Edgy Eddie",
      "Wholesome Wendy",
      "Literal Larry",
    ];

    for (const persona of personas) {
      await expect(page.locator(`text=${persona}`)).toBeVisible();
    }
  });

  test("should display How to Play section with 3 steps", async ({ page }) => {
    await expect(page.locator('text="How to Play"')).toBeVisible();
    await expect(page.locator('text="Get a Prompt"')).toBeVisible();
    await expect(page.locator('text="Submit Responses"')).toBeVisible();
    await expect(page.locator('text="Judge & Score"')).toBeVisible();
  });

  test("should have Seed Database button in dev tools section", async ({
    page,
  }) => {
    const seedButton = page.locator('button:has-text("Seed Database")');
    await expect(seedButton).toBeVisible();
  });

  test("should navigate to Create Game page when clicking Create Game", async ({
    page,
  }) => {
    await page.click('a:has-text("Create Game")');
    await expect(page).toHaveURL(/\/games\/new/);
  });

  test("should navigate to Games page when clicking Join Game", async ({
    page,
  }) => {
    await page.click('a:has-text("Join Game")');
    await expect(page).toHaveURL(/\/games/);
  });

  test("should have proper dark theme styling", async ({ page }) => {
    // Check body has dark background
    const body = page.locator("body");
    await expect(body).toHaveCSS("color-scheme", "dark");
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Title should still be visible
    await expect(page.locator("h1")).toBeVisible();

    // Buttons should stack vertically on mobile
    const createGameBtn = page.locator('a:has-text("Create Game")');
    const joinGameBtn = page.locator('a:has-text("Join Game")');

    await expect(createGameBtn).toBeVisible();
    await expect(joinGameBtn).toBeVisible();
  });
});
