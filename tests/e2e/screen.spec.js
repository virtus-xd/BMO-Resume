import { test, expect } from "@playwright/test";

const ready = async (page) => {
  await page.goto("/?t=noon");
  await expect(page.locator('.tape[data-id="okey"]')).toBeVisible();
  await expect(page.locator("#loader")).toBeHidden({ timeout: 5000 }).catch(() => {}); // Görev 11'den önce loader yok
};

test("kasete tıklayınca proje BMO ekranında açılır, Esc ile kaset yerine döner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tape = page.locator('.tape[data-id="okey"]');
  await tape.click();
  await expect(page.locator("#screenUi")).toBeVisible();
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
  await expect(page.locator("#sTitle")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(tape).toBeVisible();
  await expect(tape).toBeFocused();
});

test("animasyon sürerken ikinci kasete tıklama yok sayılır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  /* gerçek kullanıcı gibi art arda hızlı tıklama: ikinci tıklama ölçülmüş koordinata, beklemeden */
  const b = await page.locator('.tape[data-id="tbh"] .cas').boundingBox();
  await page.locator('.tape[data-id="okey"]').click();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
  await expect(page.locator('.tape[data-id="tbh"]')).toBeVisible();
});

test("proje açıkken pencere boyutu değişince ekran görünür alanda kalır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible();
  for (const [w, h] of [[1000, 1200], [1920, 1080], [800, 600]]) {
    await page.setViewportSize({ width: w, height: h });
    /* resize olayı headless'ta gecikebilir: düzen oturana kadar yeniden dene */
    await expect.poll(async () => {
      const b = await page.locator("#screenUi").boundingBox();
      return b.x >= 0 && b.y >= 0 && b.x + b.width <= w + 1 && b.y + b.height <= h + 1;
    }, { timeout: 3000 }).toBe(true);
  }
});
