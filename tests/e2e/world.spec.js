import { test, expect } from "@playwright/test";

const ready = async (page, url = "/?t=noon&test") => {
  await page.goto(url);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 8000 });
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
