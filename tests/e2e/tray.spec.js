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

test("raftaki kaseti yukarı, BMO'ya çekmek kaseti takar", async ({ page }) => {
  await ready(page);
  await swipe(page, "okey", Array.from({ length: 40 }, () => [0, -8]));
  await expect(page.locator("#screenUi")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
});
