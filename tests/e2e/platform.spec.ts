import { test, expect } from "@playwright/test";
const slugs = ["billiard", "golf", "rocket-landing", "cannon", "ramp-race"];
test("home, catalog filters, all details, about and invalid slug", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/Physics Game Lab/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Discover PhysicsThrough Play.",
  );
  await expect(page.locator(".game-card")).toHaveCount(5);
  await expect(
    page.getByRole("link", { name: "Explore Games", exact: true }),
  ).toBeVisible();
  for (const image of await page.locator(".card-art img").all()) {
    await expect(image).toBeVisible();
    expect(
      await image.evaluate(
        (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
      ),
    ).toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/platform-home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Explore Games", exact: true }).click();
  await expect(page).toHaveURL("/games");
  await page.getByRole("button", { name: "2D games" }).click();
  await expect(page.locator(".game-card")).toHaveCount(1);
  await expect(page.locator(".game-card")).toContainText("Rocket Landing");
  await page.getByRole("button", { name: "3D games" }).click();
  await expect(page.locator(".game-card")).toHaveCount(4);
  await page.getByRole("button", { name: "All games" }).click();
  await expect(page.locator(".game-card")).toHaveCount(5);
  for (const slug of slugs) {
    await page.locator(`.game-card[href="/games/${slug}"]`).click();
    await expect(page).toHaveURL(`/games/${slug}`);
    if (slug === "billiard") {
      await expect(
        page.getByRole("button", { name: /Classic Mode/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Simulation Mode/ }),
      ).toBeVisible();
      await expect(page.locator("canvas")).toHaveCount(0);
    } else {
      await expect(
        page.getByRole("heading", { name: "Game Mode", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Simulation Mode", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Concept preview · Gameplay belum tersedia"),
      ).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (slug === "billiard")
      await page.screenshot({
        path: `test-results/platform-detail-${testInfo.project.name}.png`,
        fullPage: true,
      });
    await page.reload();
    if (slug !== "billiard")
      await expect(
        page.getByRole("heading", { name: "Tentang game" }),
      ).toBeVisible();
    const detail =
      slug === "billiard"
        ? page.getByRole("region", { name: "Billiard 3D", exact: true })
        : page.getByRole("main");
    await detail.getByRole("link", { name: "Kembali ke katalog" }).click();
  }
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "About" })
    .click();
  await expect(page).toHaveURL("/about");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Rasa ingin tahu",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const response = await page.goto("/games/not-a-game");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan." }),
  ).toBeVisible();
  // Expected resource 404 on the intentional not-found request is not an app runtime error.
  expect(errors.filter((error) => !error.includes("404"))).toEqual([]);
});
test("keyboard navigation and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/games");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Lewati ke konten" }),
  ).toBeFocused();
  const filter = page.getByRole("button", { name: "2D games" });
  await filter.focus();
  await page.keyboard.press("Enter");
  await expect(filter).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".game-card")).toHaveCount(1);
  const card = page.locator(".game-card");
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/games/rocket-landing");
});
