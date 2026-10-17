import { test, expect } from "@playwright/test";

const ready = async (page, url = "/?t=noon") => {
  await page.goto(url);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  await expect(page.locator('.tape[data-id="okey"]')).toBeVisible();
};
const inViewport = (page) => page.evaluate(() => {
  const el = document.getElementById("screenUi"), r = el.getBoundingClientRect();
  return !el.hidden && r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
});

test("kasete tıklayınca proje BMO ekranında açılır, Esc ile ekran kapanır ve kaset BMO'da kalır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tape = page.locator('.tape[data-id="okey"]');
  await tape.click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
  await expect(page.locator("#sTitle")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(tape).toHaveClass(/gone/);
  await expect(page.locator("#bmoHit")).toBeFocused();
});

test("Esc sonrası BMO'ya tıklamak ekranı yeniden açar, ⏏ kaseti yerine döndürür", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tape = page.locator('.tape[data-id="tbh"]');
  await tape.click();
  /* başlık zoom sürerken (katman gizliyken) dolar: Esc'ten önce ekranın açılmasını bekle */
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("#sTitle")).toHaveText("TBH Trade");
  await page.keyboard.press("Escape");
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(tape).toHaveClass(/gone/);
  await page.locator("#bmoHit").click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("#sTitle")).toHaveText("TBH Trade");
  await page.locator("#screenUi .s-eject").click();
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(tape).not.toHaveClass(/gone/);
  await expect(tape).toBeFocused();
});

test("dışarı (arka plana) tıklamak ekranı kapatır, kaset kalır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="radar"]').click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await page.mouse.click(10, 890);
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(page.locator('.tape[data-id="radar"]')).toHaveClass(/gone/);
});

test("başka kaset takılınca öncekisi otomatik çıkar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await page.keyboard.press("Escape");
  await page.locator('.tape[data-id="jarvis"]').click();
  await expect(page.locator("#sTitle")).toHaveText("JARVIS", { timeout: 10000 });
  await expect(page.locator('.tape[data-id="okey"]')).not.toHaveClass(/gone/);
});

test("animasyon sürerken ikinci kasete tıklama yok sayılır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  /* gerçek kullanıcı gibi art arda hızlı tıklama: ikinci tıklama ölçülmüş koordinata, beklemeden */
  const b = await page.locator('.tape[data-id="tbh"]').boundingBox();
  await page.locator('.tape[data-id="okey"]').click();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator("#sTitle")).toHaveText("81 Okey", { timeout: 8000 });
  await expect(page.locator('.tape[data-id="tbh"]')).not.toHaveClass(/gone/);
});

test("açık ekran 3D BMO ekranıyla hizalı ve pencere boyutu değişince görünür alanda kalır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page, "/?t=noon&test");
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  const aligned = () => page.evaluate(() => {
    const s = window.__world.screenClientRect(), u = document.getElementById("screenUi").getBoundingClientRect();
    return Math.abs((s.left + s.width / 2) - (u.left + u.width / 2)) < 6 && Math.abs((s.top + s.height / 2) - (u.top + u.height / 2)) < 6;
  });
  await expect.poll(aligned, { timeout: 5000 }).toBe(true);
  for (const [w, h] of [[1000, 1200], [1920, 1080], [800, 600]]) {
    await page.setViewportSize({ width: w, height: h });
    /* resize olayı headless'ta gecikebilir: düzen oturana kadar yeniden dene */
    await expect.poll(() => inViewport(page), { timeout: 5000 }).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect.poll(aligned, { timeout: 5000 }).toBe(true);
});

test("zoom sürerken pencere boyutu değişirse ekran görünür alanda kalır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await page.waitForTimeout(1900); // takma bitti, zoom sürüyor
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => inViewport(page), { timeout: 5000 }).toBe(true);
});

for (const [w, h] of [[375, 812], [390, 844]]) {
  test(`${w}×${h}: dar düzende ekran BMO'nun yatay ekranına oturur, taşmaz; içerik ekranın içinde kayar`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await ready(page, "/?t=noon&test");
    await page.locator('.tape[data-id="stok"]').click();
    await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
    await expect.poll(() => inViewport(page), { timeout: 5000 }).toBe(true);
    const { s, u } = await page.evaluate(() => {
      const s = window.__world.screenClientRect(), u = document.getElementById("screenUi").getBoundingClientRect();
      return { s: { l: s.left, t: s.top, r: s.left + s.width, b: s.top + s.height }, u: { l: u.left, t: u.top, r: u.right, b: u.bottom, w: u.width, h: u.height } };
    });
    expect(u.w / u.h).toBeGreaterThan(1.3); // BMO'nun ekranı gibi yatay
    expect(u.w).toBeGreaterThan(w * 0.8);
    expect(u.l).toBeGreaterThanOrEqual(s.l - 1); expect(u.r).toBeLessThanOrEqual(s.r + 1);
    expect(u.t).toBeGreaterThanOrEqual(s.t - 1); expect(u.b).toBeLessThanOrEqual(s.b + 1);
    /* sığmayan içerik ekranın içinde kayar; altta ▼ devamı gösterir, sona gelince kalkar */
    await expect(page.locator("#screenUi")).toHaveClass(/more/);
    const eject = page.locator("#screenUi [data-act=eject]");
    await eject.scrollIntoViewIfNeeded();
    await expect(page.locator("#screenUi")).not.toHaveClass(/more/);
    await eject.click();
    await expect(page.locator("#screenUi")).toBeHidden();
  });
}

test("hareketi azalt: zoom ve CRT yok, ortada panel", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toHaveClass(/panel/);
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
  expect(await page.locator("#screenUi").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("proje açıkken dar düzene geçip kapatınca kasetler rafa yerleşir (döndürme)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => inViewport(page), { timeout: 5000 }).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(page.locator("#tray .tape")).toHaveCount(9);
  await expect(page.locator('#tray .tape[data-id="tbh"]')).toBeVisible();
});

test("hareketi azalt: dar düzende açıp genişe geçince kapatınca kaset düğmeleri sahneye döner", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press("Escape");
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(page.locator("#tapeBtns .tape")).toHaveCount(9);
  await expect(page.locator('#tapeBtns .tape[data-id="tbh"]')).toBeVisible();
});
