/* Kullanım: `node scripts/images.mjs` — kökteki bg2 JPG'lerinden public/bg/*.webp üretir */
import sharp from "sharp";
import { mkdirSync, statSync } from "node:fs";

const SOURCES = { day: "bg2.jpg", night: "bg2_gece.jpg" };
const WIDTHS = [1920, 2752];

mkdirSync("public/bg", { recursive: true });
for (const [variant, src] of Object.entries(SOURCES)) {
  for (const w of WIDTHS) {
    const out = `public/bg/${variant}-${w}.webp`;
    await sharp(src).resize({ width: w }).webp({ quality: 82 }).toFile(out);
    console.log(out, Math.round(statSync(out).size / 1024) + " KB");
  }
}
