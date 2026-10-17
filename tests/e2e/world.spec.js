import { test, expect } from "@playwright/test";

const ready = async (page, url = "/?t=noon&test") => {
  await page.goto(url);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  await page.waitForFunction(() => window.__world);
};

test("Tab ile gelinen ilk kaset düğmesi yansıtılmış 3D kasetle örtüşür", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => document.activeElement.classList.contains("tape"))) break;
  }
  const { box, want } = await page.evaluate(() => {
    const b = document.activeElement, id = b.dataset.id;
    const r = window.__world.rectOf(id), s = document.getElementById("stage").getBoundingClientRect(), k = s.width / 1920;
    const c = b.getBoundingClientRect();
    return { box: [c.left, c.top, c.width, c.height], want: [s.left + r.left * k, s.top + r.top * k, r.width * k, r.height * k] };
  });
  box.forEach((v, i) => expect(Math.abs(v - want[i])).toBeLessThanOrEqual(4));
});

test("BMO'nun tıklama alanı görünür ve BMO'nun yansıtılmış kutusunda", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await expect(page.locator("#bmoHit")).toBeVisible();
  const ok = await page.evaluate(() => {
    const r = window.__world.bmoRect(), s = document.getElementById("stage").getBoundingClientRect(), k = s.width / 1920;
    const c = document.getElementById("bmoHit").getBoundingClientRect();
    return Math.abs(c.left - (s.left + r.left * k)) <= 4 && Math.abs(c.width - r.width * k) <= 4;
  });
  expect(ok).toBe(true);
});

test("kaset düğmesine tıklamak kaseti takar ve projeyi açar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('#tapeBtns .tape[data-id="okey"]').click();
  await expect(page.locator("#sTitle")).toHaveText("81 Okey", { timeout: 8000 });
  await expect(page.locator('#tapeBtns .tape[data-id="okey"]')).toHaveClass(/gone/);
});

test("dar düzende raftaki kaset küçük resimleri boş değil (3D kaset gizliyken de çizilir)", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page);
  await expect.poll(() => page.locator("#tray .tape img[src]").count()).toBe(8);
  const opaque = await page.locator("#tray .tape img").evaluateAll((imgs) => imgs.map((img) => {
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++;
    return n / (c.width * c.height);
  }));
  opaque.forEach((f) => expect(f).toBeGreaterThan(0.3));
});

test("BMO'nun tıklama alanı kasetlerin önüne geçmez: Hakkımda kasetinin sağ kenarına tıklamak onu takar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const b = await page.locator('#tapeBtns .tape[data-id="hakkimda"]').boundingBox();
  await page.mouse.click(b.x + b.width * 0.9, b.y + b.height * 0.5);
  await expect(page.locator("#sTitle")).toHaveText(/Hakkımda/);
});

test("#liste ile açılınca 3D çizim döngüsü baştan durur", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page, "/?t=noon&test#liste");
  await expect(page.locator("#listview")).toBeVisible();
  const frames = await page.evaluate(() => new Promise((r) => { const i = window.__world.renderer.info.render, f0 = i.frame; setTimeout(() => r(i.frame - f0), 700); }));
  expect(frames).toBe(0);
});

test("hareketi azalt: BMO sallanmaz, nefes almaz", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const pose = () => page.evaluate(() => { const b = window.__world.bmo.group; return [b.getObjectByName("rig").rotation.y, b.getObjectByName("torso").scale.y].map((v) => v.toFixed(4)).join(); });
  const a = await pose(); await page.waitForTimeout(700); const c = await pose();
  expect(c).toBe(a);
  expect(a).toBe("0.0000,1.0000");
});

test("yükleme ekranı 3D dünya hazır olana kadar görünür (three.js yavaş gelse bile)", async ({ page }) => {
  await page.route(/\/assets\/world-.*\.js$/, async (route) => { await new Promise((r) => setTimeout(r, 4500)); await route.continue(); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?t=noon&test");
  await page.waitForTimeout(3800);
  await expect(page.locator("#loader")).toBeVisible();
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  expect(await page.evaluate(() => !!window.__world)).toBe(true);
});
