import { test, expect } from "@playwright/test";

const ready = async (page, url = "/?t=noon") => {
  await page.goto(url);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
};
const inViewport = (page) => page.evaluate(() => {
  const r = document.getElementById("screenUi").getBoundingClientRect();
  return !document.getElementById("screenUi").hidden && r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
});
const focusInList = (page) => page.evaluate(() => document.getElementById("listview").contains(document.activeElement));

test("dar ekranda Tab ile gezinmek sahneyi kaydırmaz; Enter ile açılan ekran görünür alanda", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page);
  for (let i = 0; i < 20; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.getElementById("room").scrollLeft)).toBe(0);
  await page.locator('.tape[data-id="okey"]').focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => inViewport(page), { timeout: 10000 }).toBe(true);
});

test("BMO ekranı açıkken açılan liste görünümünde Tab odağı listede kalır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await page.locator("#btnList").click();
  await expect(page.locator("#listview")).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Tab");
    expect(await focusInList(page)).toBe(true);
  }
});

test("#liste ile açılan görünümde Tab odağı arkadaki sahneye kaçmaz", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page, "/?t=noon#liste");
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => { const a = document.activeElement; return a === document.body || document.getElementById("listview").contains(a); })).toBe(true);
  }
});

for (const [w, h] of [[1920, 937], [1366, 657]]) {
  test(`${w}×${h} (16:9'dan geniş): bütün kasetler tamamen görünür`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await ready(page);
    const boxes = await page.locator("#tapeBtns .tape").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.top, r.bottom, r.left, r.right]; }));
    expect(boxes.length).toBe(9);
    for (const [top, bottom, left, right] of boxes) {
      expect(top).toBeGreaterThanOrEqual(0);
      expect(bottom).toBeLessThanOrEqual(h);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(w);
    }
  });
}
