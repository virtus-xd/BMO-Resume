import { test, expect } from "@playwright/test";

test("WebGL yoksa sahne kurulmaz; Liste notla açılır, odaya dönüş gizli", async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/.test(type) ? null : orig.call(this, type, ...rest);
    };
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?t=noon");
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  await expect(page.locator("#listview")).toBeVisible();
  await expect(page.locator(".lv-no3d")).toBeVisible();
  await expect(page.locator(".lv-card")).toHaveCount(7);
  await expect(page.locator("#listview [data-act=close]")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#listview")).toBeVisible();
  expect(errors).toEqual([]);
});

test("sahne açıkken WebGL bağlamı kaybolursa aynı yedek devreye girer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?t=noon&test");
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  await page.waitForFunction(() => window.__world);
  await expect(page.locator("#listview")).toBeHidden();
  await page.evaluate(() => window.__world.renderer.getContext().getExtension("WEBGL_lose_context").loseContext());
  await expect(page.locator("#listview")).toBeVisible();
  await expect(page.locator(".lv-no3d")).toBeVisible();
});

test("sayfa başlığı dile göre değişir", async ({ page }) => {
  await page.goto("/?t=noon");
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  const tr = await page.title();
  await page.locator("#bmoKeys [data-key=green]").click();
  const other = await page.title();
  expect(new Set([tr, other])).toEqual(new Set(["Erdem — Portfolyo", "Erdem — Portfolio"]));
});

test("Liste açıkken 3D çizim döngüsü durur, kapanınca sürer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?t=noon&test");
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  await page.waitForFunction(() => window.__world);
  const frames = () => page.evaluate(() => new Promise((r) => {
    const info = window.__world.renderer.info.render, f0 = info.frame;
    setTimeout(() => r(info.frame - f0), 600);
  }));
  expect(await frames()).toBeGreaterThan(0);
  await page.locator("#bmoKeys [data-key=dpad]").click();
  await expect(page.locator("#listview")).toBeVisible();
  expect(await frames()).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#listview")).toBeHidden();
  await expect.poll(frames).toBeGreaterThan(0);
});
