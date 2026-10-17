/* Kullanım: önce `npm run build && npm run preview` (4173), sonra `node scripts/og.mjs` */
import { chromium } from "@playwright/test";

/* headless'ta WebGL: SwiftShader */
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, locale: "tr-TR" });
await page.goto("http://localhost:4173/?t=sunset&test");
await page.locator("#loader").waitFor({ state: "hidden", timeout: 20000 });
await page.waitForFunction(() => window.__world, null, { timeout: 20000 }); // 3D dünya hazır
await page.waitForTimeout(3500); // karşılama repliği yazılsın, el sallama bitsin
await page.screenshot({ path: "public/og-image.png" });
await browser.close();
console.log("public/og-image.png yazıldı");
