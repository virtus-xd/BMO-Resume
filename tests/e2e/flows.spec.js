import { test, expect } from "@playwright/test";

const ready = async (page, url = "/?t=noon") => {
  await page.goto(url);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 5000 });
};

test("sürükle-bırak ile kaset takılır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tape = await page.locator('.tape[data-id="tbh"] .cas').boundingBox();
  const slot = await page.locator("#bmo-slot").boundingBox();
  await page.mouse.move(tape.x + tape.width / 2, tape.y + tape.height / 2);
  await page.mouse.down();
  await page.mouse.move(tape.x + 40, tape.y - 40, { steps: 5 });
  await page.mouse.move(slot.x + slot.width / 2, slot.y + slot.height / 2, { steps: 15 });
  await page.mouse.up();
  await expect(page.locator("#sTitle")).toHaveText("TBH Trade");
});

test("BMO'dan uzağa bırakılan kaset yerine döner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tapeLoc = page.locator('.tape[data-id="tbh"]');
  const tape = await tapeLoc.locator(".cas").boundingBox();
  await page.mouse.move(tape.x + tape.width / 2, tape.y + tape.height / 2);
  await page.mouse.down();
  await page.mouse.move(200, 200, { steps: 10 });
  await page.mouse.up();
  await expect(tapeLoc).toBeVisible();
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(page.locator("#speechText")).toContainText("ıskaladın");
});

test("klavye: Enter ile tak, odak ekranda, Esc ile odak kasete döner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tape = page.locator('.tape[data-id="radar"]');
  await tape.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#sTitle")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#screenUi button.s-eject")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tape).toBeFocused();
});

test("#liste ile hızlı görünüm doğrudan açılır, Esc ile kapanır", async ({ page }) => {
  await ready(page, "/?t=noon#liste");
  await expect(page.locator("#listview")).toBeVisible();
  await expect(page.locator(".lv-card")).toHaveCount(6);
  await expect(page.locator(".lv-about")).toContainText("Mersin");
  await page.keyboard.press("Escape");
  await expect(page.locator("#listview")).toBeHidden();
});

test("TR/EN geçişi metinleri değiştirir ve kalıcıdır", async ({ page }) => {
  await ready(page);
  await page.locator("#btnLang").click();
  await expect(page.locator('.tape[data-id="radar"]')).toContainText("Radar Mines");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.locator('.tape[data-id="radar"]')).toContainText("Radar Mines");
});

test("hareketi azalt: zoom yerine ortada panel açılır", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toHaveClass(/panel/);
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
});

test("Finn/Jake nesnesi tıklanınca BMO konuşur", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('[data-obj="viola"]').click();
  await expect(page.locator("#speechText")).toContainText("viola", { timeout: 4000 });
});

test("localStorage engelliyken site açılır", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  await ready(page);
  await expect(page.locator('.tape[data-id="okey"]')).toBeVisible();
});
