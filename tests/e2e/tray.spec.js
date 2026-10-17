import { test, expect } from "@playwright/test";

/* telefon: alttaki kaset rafı gerçek dokunmayla (CDP touch olayları: tarayıcı kaydırmayı kendi başlatır) */
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const ready = async (page) => {
  await page.goto("/?t=noon&test");
  await expect(page.locator("#loader")).toBeHidden({ timeout: 15000 });
  await page.waitForFunction(() => window.__world);
};
async function swipe(page, id, steps) {
  const box = await page.locator(`#tray .tape[data-id="${id}"]`).boundingBox();
  const cdp = await page.context().newCDPSession(page);
  let x = box.x + box.width / 2, y = box.y + box.height / 2;
  const touch = (type) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  await touch("touchStart");
  for (const [dx, dy] of steps) { x += dx; y += dy; await touch("touchMove"); await page.waitForTimeout(8); }
  await touch("touchEnd");
}

for (const step of [1, 2, 4]) {
  test(`raftaki kasetin üstünden ${step} px adımla yana kaydırmak rafı kaydırır, kaseti kaldırmaz`, async ({ page }) => {
    await ready(page);
    /* kalkan kaset bir anlığına .gone olur (ıskalanınca rafa döner): her değişimi kaydet */
    await page.evaluate(() => {
      window.__picked = 0;
      new MutationObserver((ms) => ms.forEach((m) => { if (m.target.classList.contains("gone")) window.__picked++; }))
        .observe(document.getElementById("tray"), { subtree: true, attributeFilter: ["class"] });
    });
    await swipe(page, "tbh", Array.from({ length: Math.ceil(150 / step) }, (_, i) => [-step, i < 4 ? -1 : 0]));
    await expect.poll(() => page.evaluate(() => document.getElementById("tray").scrollLeft)).toBeGreaterThan(40);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.__picked)).toBe(0);
    await expect(page.locator("#speechText")).not.toContainText("ıskaladın");
    await expect(page.locator("#tray .tape.gone")).toHaveCount(0);
  });
}

/* her karede: 3D kaset görünürken ekrandaki dikdörtgeni, uçan kopya var mı. İniş: kopya kaldırıldığı an son
   konumu ve o andaki raf yeri (kare örneklemek yavaş GPU'da son kareyi kaçırır) */
const track = (page, id) => page.evaluate((id) => {
  const w = window.__world, out = { tape: [], flying: 0, landed: null };
  window.__track = out;
  const thumb = document.querySelector(`#tray .tape[data-id="${id}"] .thumb`);
  new MutationObserver((ms) => ms.forEach((m) => m.removedNodes.forEach((n) => {
    if (!n.classList?.contains("tape-fly")) return;
    const s = n.style, f = { left: parseFloat(s.left), top: parseFloat(s.top), width: parseFloat(s.width), height: parseFloat(s.height) };
    out.landed = { fly: f, spot: thumb.getBoundingClientRect().toJSON() };
  }))).observe(document.body, { childList: true });
  (function loop() {
    if (w.tapes.get(id).group.visible) out.tape.push(w.liveRect(id));
    if (document.querySelector(".tape-fly")) out.flying++;
    window.__trackRaf = requestAnimationFrame(loop);
  })();
}, id);
const tracked = (page) => page.evaluate(() => { cancelAnimationFrame(window.__trackRaf); return window.__track; });
function expectOnScreen(rects) {
  expect(rects.length).toBeGreaterThan(0);
  for (const r of rects) {
    expect(r.left).toBeGreaterThanOrEqual(-4); expect(r.top).toBeGreaterThanOrEqual(-4);
    expect(r.left + r.width).toBeLessThanOrEqual(394); expect(r.top + r.height).toBeLessThanOrEqual(848);
  }
}
async function expectLanded(page, id, { flying, landed }) {
  const btn = page.locator(`#tray .tape[data-id="${id}"]`);
  await expect(btn).not.toHaveClass(/gone/);
  await expect(page.locator(".tape-fly")).toHaveCount(0);
  expect(flying).toBeGreaterThan(0);
  /* kopya, kaldırıldığı an raftaki yerinin tam üstünde */
  const { fly, spot } = landed;
  expect(Math.abs(fly.left + fly.width / 2 - (spot.left + spot.width / 2))).toBeLessThan(6);
  expect(Math.abs(fly.top + fly.height / 2 - (spot.top + spot.height / 2))).toBeLessThan(6);
  expect(Math.abs(fly.width - spot.width)).toBeLessThan(6);
  /* raf o yere kaydı: kaset rafın görünen kısmında */
  await expect.poll(async () => {
    const t = await btn.locator(".thumb").boundingBox(), r = await page.locator("#tray").boundingBox();
    return t.x >= r.x - 1 && t.x + t.width <= r.x + r.width + 1;
  }).toBe(true);
}

test("çıkarınca kaset ekranda kalır ve raftaki yerine uçar (raf o yere kayar)", async ({ page }) => {
  await ready(page);
  await page.locator('#tray .tape[data-id="davetiye"]').click();
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await page.evaluate(() => { document.getElementById("tray").scrollLeft = 0; }); // davetiye'nin yeri görünmesin
  await track(page, "davetiye");
  await page.locator("#screenUi .s-eject").click();
  await expect(page.locator('#tray .tape[data-id="davetiye"]')).not.toHaveClass(/gone/, { timeout: 8000 });
  const t = await tracked(page);
  expectOnScreen(t.tape);
  await expectLanded(page, "davetiye", t);
});

test("BMO'ya yetişmeyen kaset düşer, ekranda kalır ve raftaki yerine uçar", async ({ page }) => {
  await ready(page);
  await swipe(page, "okey", [...Array.from({ length: 22 }, () => [0, -12]), ...Array.from({ length: 12 }, () => [-4, 0])]);
  await track(page, "okey"); // bırakıldığı andan sonrası (raftan kalkarken parmağın altında belirmesi ayrı)
  await page.waitForFunction(() => window.__track.landed, null, { timeout: 8000 });
  await expect(page.locator("#screenUi")).toBeHidden(); // takılmadı: ıskaladı
  const t = await tracked(page);
  expectOnScreen(t.tape);
  await expectLanded(page, "okey", t);
});

test("raftaki kaseti yukarı, BMO'ya çekmek kaseti takar", async ({ page }) => {
  await ready(page);
  await swipe(page, "okey", Array.from({ length: 40 }, () => [0, -8]));
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
});
