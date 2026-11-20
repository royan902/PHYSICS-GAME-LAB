import { test, expect } from "@playwright/test";
test("complete all five challenges through real controls", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/games/billiard");
  const solutions = [
    [[-90, 18]],
    [
      [-35.6, 18],
      [74.5, 65],
    ],
    [
      [-35, 32],
      [-172.8, 25],
    ],
    [[-57.5, 45]],
    [
      [-34.7, 18],
      [-33.5, 50],
      [51.7, 65],
    ],
  ];
  for (let level = 0; level < 5; level++) {
    for (const [angle, power] of solutions[level]) {
      await expect(page.getByRole("button", { name: /^Shoot/ })).toBeEnabled({
        timeout: 20000,
      });
      for (const [label, value] of [
        ["Sudut bidikan", angle],
        ["Power", power],
      ] as const) {
        await page
          .getByRole("slider", { name: label, exact: true })
          .evaluate((node, value) => {
            Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value",
            )!.set!.call(node, String(value));
            node.dispatchEvent(new Event("input", { bubbles: true }));
          }, value);
      }
      await page.getByRole("button", { name: /^Shoot/ }).click();
      await expect(page.locator(".billiard-viewport")).not.toHaveAttribute(
        "data-state",
        "moving",
        { timeout: 20000 },
      );
    }
    await expect(page.locator(".billiard-viewport")).toHaveAttribute(
      "data-state",
      "won",
    );
    if (level < 4)
      await page.getByRole("button", { name: "Next level →" }).click();
  }
  await expect(
    page.getByText("Seluruh tantangan selesai. Selamat bereksperimen!"),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/previews/billiard-all-levels-complete.png",
    fullPage: true,
  });
});
