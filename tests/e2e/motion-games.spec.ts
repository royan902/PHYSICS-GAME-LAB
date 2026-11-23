import { expect, test } from "@playwright/test";

const MOTION_SLUGS = [
  "golf",
  "rocket-landing",
  "cannon",
  "ramp-race",
] as const;

test.describe("motion simulation games", () => {
  for (const slug of MOTION_SLUGS) {
    test(`loads ${slug} player cleanly in Game and Simulation modes`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(`/games/${slug}/play`);
      const frame = page.frameLocator('iframe[src^="/games-html/"]');
      await expect(frame.locator("body")).toHaveAttribute("data-ready", "true", {
        timeout: 15000,
      });
      await expect(frame.locator("#runtime-error")).toBeHidden();
      await expect(frame.locator("canvas")).toBeVisible();

      // Switch to Simulation Mode and back to Game Mode cleanly
      await frame.locator("#mode-sim-btn").click();
      await expect(frame.locator("#panel-sim-controls")).toBeVisible();
      await frame.locator("#mode-game-btn").click();
      await expect(frame.locator("#panel-game-controls")).toBeVisible();

      expect(errors).toEqual([]);
    });
  }

  test("rocket-landing free-fall updates telemetry in browser", async ({
    page,
  }) => {
    await page.goto("/games/rocket-landing/play");
    const frame = page.frameLocator('iframe[src^="/games-html/"]');
    await expect(frame.locator("body")).toHaveAttribute("data-ready", "true", {
      timeout: 15000,
    });
    const altBefore = await frame.locator("#val-alt").textContent();
    await page.waitForTimeout(600);
    const altAfter = await frame.locator("#val-alt").textContent();
    expect(altBefore).not.toBe(altAfter);
  });
});
