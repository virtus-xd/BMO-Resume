import { test, expect } from "@playwright/test";

for (const [w, h] of [[375, 812], [768, 1024], [1440, 900], [2560, 1440]]) {
  test(`${w}×${h}: yatay kaydırma yok, kasetler erişilebilir, ekran görüntüsü`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/?t=sunset");
    await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    const tape = page.locator('.tape[data-id="okey"]');
    await tape.scrollIntoViewIfNeeded();
    await expect(tape).toBeVisible();
    await page.screenshot({ path: `test-results/shots/${w}x${h}.png` });
    await tape.click();
    /* takma (~1.4 sn) + zoom (0.7 sn); paralel koşuda büyük ekranda daha uzun sürebilir */
    await expect(page.locator("#screenUi")).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: `test-results/shots/${w}x${h}-open.png` });
  });
}
