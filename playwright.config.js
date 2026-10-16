import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45000,
  /* WebGL headless'ta SwiftShader (CPU) ile çizilir: çok işçi birbirini yavaşlatıp zaman aşımına düşürüyor */
  workers: 2,
  /* SwiftShader'da zoom'lu kareler yavaş; GSAP lag smoothing animasyonları uzatır → beklemeler 10 sn */
  expect: { timeout: 10000 },
  use: { baseURL: "http://localhost:4173", locale: "tr-TR", timezoneId: "Europe/Istanbul" },
  webServer: { command: "npm run build && npm run preview", url: "http://localhost:4173", reuseExistingServer: true, timeout: 120000 },
  /* headless'ta WebGL: SwiftShader yazılım çizicisi */
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } } }],
});
