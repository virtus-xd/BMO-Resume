import { test, expect } from "@playwright/test";
import sharp from "sharp";

const ready = async (page, url = "/?t=noon&test") => {
  await page.goto(url);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  await page.waitForFunction(() => window.__world);
};
const key = (page, k) => page.locator(`#bmoKeys [data-key=${k}]`);
/* tıklama alanının ortasındaki pikselin rengi (3D çizim) */
async function rgbAt(page, box) {
  const png = await page.screenshot({ clip: { x: Math.round(box.x + box.width / 2) - 1, y: Math.round(box.y + box.height / 2) - 1, width: 3, height: 3 } });
  const { data } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const px = [0, 0, 0];
  for (let i = 0; i < 9; i++) for (let c = 0; c < 3; c++) px[c] += data[i * (data.length / 9) + c] / 9;
  return px;
}

test("üstte tabela ve ayar tuşu yok; site adı ekran okuyucu için başlıkta duruyor", async ({ page }) => {
  await ready(page);
  await expect(page.locator(".sign")).toHaveCount(0);
  await expect(page.locator("#topbar button")).toHaveCount(0);
  const h1 = page.locator("#topbar h1");
  await expect(h1).toContainText("Erdem");
  expect((await h1.boundingBox()).width).toBeLessThanOrEqual(1);
});

for (const [w, h] of [[1440, 900], [390, 844]]) {
  test(`${w}×${h}: BMO'nun tuş alanları 3D tuşların üstünde ve en az 24 px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await ready(page);
    await page.waitForTimeout(2500); // el sallama bitsin
    const isHue = {
      red: ([r, g, b]) => r > g + 50 && r > b + 50,
      triangle: ([r, g, b]) => b > r + 50 && b > g,
      green: ([r, g, b]) => g > r + 30 && g > b + 30,
      dpad: ([r, g, b]) => r > 150 && g > 110 && b < r - 70,
    };
    for (const k of Object.keys(isHue)) {
      const box = await key(page, k).boundingBox();
      expect(box.width, k).toBeGreaterThanOrEqual(23.5);
      expect(box.height, k).toBeGreaterThanOrEqual(23.5);
      const rgb = await rgbAt(page, box);
      expect(isHue[k](rgb), `${k} ortası: rgb(${rgb.map(Math.round)})`).toBe(true);
    }
  });
}

test("tuşlar: üstüne gelince işi yazar; kırmızı ses, üçgen gün saati, yeşil dil, artı liste", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await key(page, "red").hover();
  await expect(page.locator("#speechTip")).toHaveText("[kırmızı] ses: kapalı");
  await key(page, "red").click();
  await expect(key(page, "red")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#speechTip")).toHaveText("[kırmızı] ses: açık");
  expect(await page.evaluate(() => localStorage.getItem("sound"))).toContain("on");

  await key(page, "triangle").click();
  await expect(page.locator("html")).toHaveClass(/t-sunset/);

  await key(page, "dpad").click();
  await expect(page.locator("#listview")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#listview")).toBeHidden();

  await key(page, "green").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#speechText")).toHaveText("Hello! I speak English now!", { timeout: 5000 });
});

test("BMO'nun tuşları klavyeyle seçilir ve çalışır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await key(page, "triangle").focus();
  await expect(page.locator("#speechTip")).toHaveText("[üçgen] saat: öğle");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveClass(/t-sunset/);
  await expect(page.locator("#speechTip")).toHaveText("[üçgen] saat: gün batımı");
});

test("kaset takılıyken ekranın sağ üstünde simgeler; dil simgesinde odak kalır, ses ve saat değişir", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('#tapeBtns .tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("#screenUi .s-ctl button")).toHaveCount(4);
  const ui = await page.locator("#screenUi").boundingBox(), ctl = await page.locator("#screenUi .s-ctl").boundingBox();
  expect(ctl.x + ctl.width).toBeGreaterThan(ui.x + ui.width * 0.85);
  expect(ctl.y).toBeLessThan(ui.y + ui.height * 0.15);

  await page.locator("#screenUi [data-ctl=lang]").click();
  await expect(page.locator("#screenUi .s-kind")).toContainText("Mobile Game");
  expect(await page.evaluate(() => document.activeElement?.dataset.ctl)).toBe("lang");

  await page.locator("#screenUi [data-ctl=sound]").click();
  await expect(page.locator("#screenUi [data-ctl=sound]")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#screenUi [data-ctl=time]").click();
  await expect(page.locator("html")).toHaveClass(/t-sunset/);
  await expect(page.locator("#screenUi [data-ctl=time]")).toHaveText("◒");
});

test("telefonda tam ekran görünümde simgeler sağ üstte ve dokunulabilir boyutta", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  for (const b of await page.locator("#screenUi .s-ctl button").all()) {
    const r = await b.boundingBox();
    expect(r.width).toBeGreaterThanOrEqual(40); expect(r.height).toBeGreaterThanOrEqual(40);
    expect(r.x + r.width).toBeLessThanOrEqual(390);
  }
});

test("3D yokken listenin başlığındaki dil düğmesi dili değiştirir, odak düğmede kalır", async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/.test(type) ? null : orig.call(this, type, ...rest); };
  });
  await page.goto("/?t=noon");
  await expect(page.locator("#listview")).toBeVisible({ timeout: 15000 });
  await expect(page.locator("#bmoKeys")).toBeHidden();
  await page.locator("#listview [data-act=lang]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#listview [data-act=lang]")).toHaveText("EN");
  await expect(page.locator("#listview [data-act=lang]")).toBeFocused();
});
