import { test, expect } from "@playwright/test";

/**
 * Visual regression tests for neon cyberpunk styling.
 * These tests capture screenshots to verify the visual appearance
 * of key UI components.
 */

test.describe("Visual Regression - Neon Theme", () => {
  test("home page hero section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Take screenshot of hero section
    const hero = page.locator("header").first();
    await expect(hero).toHaveScreenshot("home-hero.png", {
      maxDiffPixels: 100,
    });
  });

  test("home page full page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("home-full.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test("create game page", async ({ page }) => {
    await page.goto("/games/new");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("create-game.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test("games list page", async ({ page }) => {
    await page.goto("/games");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("games-list.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test("neon button hover states", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Hover over Create Game button
    const createBtn = page.locator('a:has-text("Create Game")');
    await createBtn.hover();
    await page.waitForTimeout(300); // Wait for hover animation

    await expect(createBtn).toHaveScreenshot("btn-neon-pink-hover.png", {
      maxDiffPixels: 50,
    });
  });

  test("game card hover effect", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find a game card (e.g., in game modes section)
    const gameCard = page.locator(".game-card").first();
    await gameCard.hover();
    await page.waitForTimeout(300);

    await expect(gameCard).toHaveScreenshot("game-card-hover.png", {
      maxDiffPixels: 100,
    });
  });
});

test.describe("Visual Regression - Responsive", () => {
  test("mobile home page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("home-mobile.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test("tablet home page", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("home-tablet.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test("mobile create game page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/games/new");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("create-game-mobile.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });
});

test.describe("Visual Regression - Components", () => {
  test("AI persona cards on home page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to AI personas section
    await page.locator('text="Meet the AI Players"').scrollIntoViewIfNeeded();

    const personasSection = page.locator('section:has-text("Meet the AI Players")');
    await expect(personasSection).toHaveScreenshot("ai-personas-section.png", {
      maxDiffPixels: 200,
    });
  });

  test("how to play section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator('text="How to Play"').scrollIntoViewIfNeeded();

    const howToPlaySection = page.locator('section:has-text("How to Play")');
    await expect(howToPlaySection).toHaveScreenshot("how-to-play-section.png", {
      maxDiffPixels: 200,
    });
  });

  test("game modes section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator('text="Game Modes"').scrollIntoViewIfNeeded();

    const gameModesSection = page.locator('section:has-text("Game Modes")');
    await expect(gameModesSection).toHaveScreenshot("game-modes-section.png", {
      maxDiffPixels: 200,
    });
  });
});

test.describe("Visual Regression - Dark Theme Elements", () => {
  test("scrollbar styling", async ({ page }) => {
    await page.goto("/");

    // Force scrollbar to appear by making content scroll
    await page.evaluate(() => {
      document.body.style.height = "200vh";
    });
    await page.waitForTimeout(100);

    // Screenshot with scrollbar visible
    await expect(page).toHaveScreenshot("with-scrollbar.png", {
      maxDiffPixels: 500,
    });
  });

  test("input focus states", async ({ page }) => {
    await page.goto("/games/new");
    await page.waitForLoadState("networkidle");

    const input = page.locator('input[placeholder="Enter your name"]');
    await input.focus();
    await page.waitForTimeout(100);

    await expect(input).toHaveScreenshot("input-focused.png", {
      maxDiffPixels: 50,
    });
  });
});
