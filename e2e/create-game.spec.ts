import { test, expect } from "@playwright/test";

test.describe("Create Game Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/games/new");
  });

  test("should display Create Game title with neon styling", async ({
    page,
  }) => {
    const title = page.locator("h1 .neon-text-pink");
    await expect(title).toHaveText("Create Game");
  });

  test("should have a back link to games list", async ({ page }) => {
    const backLink = page.locator('a:has-text("Back to Games")');
    await expect(backLink).toBeVisible();
  });

  test("should have username input field", async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter your name"]');
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute("maxlength", "20");
  });

  test("should allow entering a username", async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter your name"]');
    await usernameInput.fill("TestPlayer");
    await expect(usernameInput).toHaveValue("TestPlayer");
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

  test("should allow selecting a game mode", async ({ page }) => {
    // Click on AI Battle Royale mode
    const battleRoyaleBtn = page.locator('button:has-text("AI Battle Royale")');
    await battleRoyaleBtn.click();

    // Should have selected styling (cyan border)
    await expect(battleRoyaleBtn).toHaveClass(/border-\[--color-neon-cyan\]/);
  });

  test("should display all AI persona options", async ({ page }) => {
    const personas = [
      "Chaotic Carl",
      "Sophisticated Sophie",
      "Edgy Eddie",
      "Wholesome Wendy",
      "Literal Larry",
    ];

    for (const persona of personas) {
      await expect(page.locator(`button:has-text("${persona}")`)).toBeVisible();
    }
  });

  test("should allow toggling AI opponents", async ({ page }) => {
    // Chaotic Carl should be selected by default
    const chaoticCarlBtn = page.locator('button:has-text("Chaotic Carl")');
    await expect(chaoticCarlBtn).toHaveClass(/border-\[--color-neon-purple\]/);

    // Select another AI
    const sophieBtn = page.locator('button:has-text("Sophisticated Sophie")');
    await sophieBtn.click();
    await expect(sophieBtn).toHaveClass(/border-\[--color-neon-purple\]/);

    // Deselect Chaotic Carl
    await chaoticCarlBtn.click();
    await expect(chaoticCarlBtn).not.toHaveClass(
      /border-\[--color-neon-purple\]/
    );
  });

  test("should show selected AI count", async ({ page }) => {
    // Initially 1 AI selected (Chaotic Carl)
    await expect(page.locator("text=Selected: 1 AI player(s)")).toBeVisible();

    // Select another AI
    await page.click('button:has-text("Edgy Eddie")');
    await expect(page.locator("text=Selected: 2 AI player(s)")).toBeVisible();
  });

  test("should have link to create custom persona", async ({ page }) => {
    const customPersonaLink = page.locator(
      'a:has-text("Create custom persona")'
    );
    await expect(customPersonaLink).toBeVisible();
  });

  test("should navigate to settings when clicking create custom persona", async ({
    page,
  }) => {
    const customPersonaLink = page.locator(
      'a:has-text("Create custom persona")'
    );
    await customPersonaLink.click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test("should display points to win options", async ({ page }) => {
    const pointOptions = ["5", "7", "10", "15"];

    for (const points of pointOptions) {
      await expect(
        page.locator(`button:has-text("${points}")`).first()
      ).toBeVisible();
    }
  });

  test("should allow selecting points to win", async ({ page }) => {
    const tenPointsBtn = page.locator(".game-card button").filter({ hasText: "10" });
    await tenPointsBtn.click();

    // Should have selected styling (green border)
    await expect(tenPointsBtn).toHaveClass(/border-\[--color-neon-green\]/);
  });

  test("should have Create Game button with neon styling", async ({ page }) => {
    const createBtn = page.locator('button:has-text("Create Game")');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toHaveClass(/btn-neon-green/);
  });

  test("should show error when submitting without username", async ({
    page,
  }) => {
    // Clear any default username and try to create
    const createBtn = page.locator('button:has-text("Create Game")');
    await createBtn.click();

    // Should show error message
    await expect(page.locator("text=Please enter a username")).toBeVisible();
  });

  test("should show error when no AI opponents selected", async ({ page }) => {
    // Fill in username
    await page.fill('input[placeholder="Enter your name"]', "TestPlayer");

    // Deselect all AI opponents
    await page.click('button:has-text("Chaotic Carl")');

    // Try to create game
    await page.click('button:has-text("Create Game")');

    // Should show error
    await expect(
      page.locator("text=Please select at least one AI opponent")
    ).toBeVisible();
  });

  test("should navigate back when clicking Back to Games", async ({ page }) => {
    await page.click('a:has-text("Back to Games")');
    await expect(page).toHaveURL(/\/games/);
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // All main elements should still be visible
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.locator('input[placeholder="Enter your name"]')
    ).toBeVisible();
    await expect(page.locator('button:has-text("Create Game")')).toBeVisible();
  });
});
