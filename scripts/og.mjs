/* Kullanım: önce `npm run build && npm run preview` (4173), sonra `node scripts/og.mjs` */
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, locale: "tr-TR" });
await page.goto("http://localhost:4173/?t=sunset");
await page.locator("#loader").waitFor({ state: "hidden" });
await page.waitForTimeout(3500); // karşılama repliği yazılsın
await page.screenshot({ path: "public/og-image.png" });
await browser.close();
console.log("public/og-image.png yazıldı");
