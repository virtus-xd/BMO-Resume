import { test, expect } from "@playwright/test";

/* test.fixme: 3D takma/zoom akışı Görev 6–7'de gelince yeniden açılacak */

const ready = async (page, url = "/?t=noon") => {
  await page.goto(url);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 5000 });
};

const center = async (loc) => { const b = await loc.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const grab = async (page, id) => {
  const [x, y] = await center(page.locator(`#tapeBtns .tape[data-id="${id}"]`));
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 30, y - 30, { steps: 5 });
};

test("sürükle-bırak ile kaset takılır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await grab(page, "tbh");
  const [bx, by] = await center(page.locator("#bmoHit"));
  await page.mouse.move(bx, by, { steps: 15 });
  await page.mouse.up();
  await expect(page.locator("#sTitle")).toHaveText("TBH Trade", { timeout: 8000 });
  await expect(page.locator('#tapeBtns .tape[data-id="tbh"]')).toHaveClass(/gone/);
});

test("BMO'dan uzağa bırakılan kaset yerine döner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tapeLoc = page.locator('#tapeBtns .tape[data-id="tbh"]');
  await grab(page, "tbh");
  await page.mouse.move(200, 200, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator("#speechText")).toContainText("ıskaladın");
  await expect(tapeLoc).not.toHaveClass(/gone/);
  await expect(tapeLoc).toBeVisible();
  await expect(page.locator("#screenUi")).toBeHidden();
});

test("sürükleme iptal edilirse (pointercancel) ıskalama sayılır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tapeLoc = page.locator('#tapeBtns .tape[data-id="okey"]');
  await grab(page, "okey");
  await expect(tapeLoc).toHaveClass(/gone/);
  await tapeLoc.dispatchEvent("pointercancel", { pointerId: 1 });
  await expect(page.locator("#speechText")).toContainText("ıskaladın");
  await expect(tapeLoc).not.toHaveClass(/gone/);
  await page.mouse.up();
});

test("kaset kapılınca ipucu satırı gizlenir", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await grab(page, "jarvis");
  await expect(page.locator("#speechHint")).toBeHidden();
  await page.mouse.up();
});

test.fixme("klavye: Enter ile tak, odak ekranda, Esc ile odak kasete döner", async ({ page }) => {
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

test.fixme("hareketi azalt: zoom yerine ortada panel açılır", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toHaveClass(/panel/);
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
});

test("localStorage engelliyken site açılır", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  await ready(page);
  await expect(page.locator('.tape[data-id="okey"]')).toBeVisible();
});
