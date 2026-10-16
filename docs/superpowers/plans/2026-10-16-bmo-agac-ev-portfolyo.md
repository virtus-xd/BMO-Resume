# BMO Ağaç Ev Portfolyosu — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut tek dosyalı "Teypo kaset odası" sitesini; BMO'nun, gün/gece döngülü SVG ağaç evde kasetlerle projeleri gösterdiği, TR/EN, işveren dostu bir portfolyoya dönüştürmek.

**Architecture:** Vite + saf JS ES modülleri. Tüm görseller JS modüllerinde şablon dizesi olarak tutulan satır içi SVG'ler; 4 parallax katmanı bir `.camera` kabının içinde, kamera zoom'u bu kabın GSAP dönüşümüyle yapılır. Modüller `state.js`'teki olay yayıcı üzerinden haberleşir; saf mantık (gün dilimi, dil seçimi, kamera hesabı, yuva atama, ezgi üretimi) ayrı fonksiyonlarda ve Vitest ile test edilir; etkileşim akışları Playwright ile.

**Tech Stack:** Vite 8.3.4, GSAP 3.15.0, Vitest 5.0.5 + jsdom 30.1.3, @playwright/test 1.64.1, Node 24.

**Spec:** `docs/superpowers/specs/2026-10-16-bmo-agac-ev-portfolyo-design.md`

## Global Constraints

- Görseller yalnızca SVG/CSS; raster yalnızca `public/shots/*.webp` ve `public/og-image.png`.
- Çalışma zamanı bağımlılığı yalnızca `gsap` (`3.15.0`, tam sürüm sabit).
- Sahne tasarım ölçeği `1920 × 1080`; güvenli bölge x `240–1680` (tüm etkileşimli öğeler bunun içinde).
- Dar düzen medya sorgusu: `(max-width: 700px), (orientation: portrait)`.
- Gün dilimleri (yerel saat): sabah `06–10`, öğle `11–16`, gün batımı `17–19`, gece `20–05`.
- Dil önceliği: `localStorage.lang` > `navigator.language` (`tr…` ise TR) > EN; eksik anahtar TR'ye düşer.
- Ses varsayılan **kapalı**; chiptune gain ≤ `0.04`; `AudioContext` yalnızca kullanıcı etkileşiminden sonra.
- Her `localStorage` erişimi `try/catch` içinde (`store` yardımcısı üzerinden).
- `prefers-reduced-motion: reduce` → parallax, zoom, sallanma, parçacıklar kapalı; proje ekranı ortada panel.
- Fontlar: `Gochi Hand` (başlık/balon), `VT323` (BMO ekranı), `Nunito` 500/700/800 (metin).
- Dokunma hedefleri en az `44px`.
- Altbilgi notu: TR "BMO fan-art'ıdır. Adventure Time © Cartoon Network." / EN "BMO is fan art. Adventure Time © Cartoon Network."
- Koreografi sürerken (`state.busy`) yeni etkileşimler yok sayılır.
- Her commit mesajı sonunda: `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`

## Review Focus

1. **Proje açıkken pencere boyutu/yön değişir** → kamera ve BMO ekranı katmanı yeniden hizalanır, ekran görünür alanda kalır (Görev 10'daki e2e testi).
2. **Animasyon sürerken ikinci kasete hızlı tıklama** → yalnızca ilk kaset açılır, ikinci tıklama yok sayılır (Görev 10'daki e2e testi).
3. **Linki/ekran görüntüsü olmayan proje** (`url: ""`, `"#"`, `shots: []`) → ilgili bölüm gizlenir, boş link çıkmaz (Görev 10 birim testi `renderScreen`).
4. **`localStorage` hata fırlatır (gizli mod)** → site varsayılanlarla açılır (Görev 1 birim testi `store`).
5. **Kaset takılıyken dar ↔ geniş düzene geçiş** → takılı kaset rafta/sahnede gizli kalır, çıkarınca doğru yerine döner (Görev 8 birim testi `placeTapes`).

---

## Dosya Haritası

| Dosya | Sorumluluk |
|---|---|
| `index.html` | `<head>` (SEO/OG/JSON-LD/font), DOM iskeleti, `<noscript>` |
| `package.json`, `vite.config.js`, `playwright.config.js` | Araçlar |
| `src/main.js` | Modülleri başlatır ve olaylarla bağlar (tek "kablolama" dosyası) |
| `src/state.js` | `createBus`, `bus`, `state`, `store` |
| `src/data/projects.json` | Proje içerikleri (TR/EN) |
| `src/data/projects.js` | `PROJECTS`, `validateProjects`, `usableLinks`, `assignSlots` |
| `src/data/profile.js` | İsim, e-posta, GitHub, LinkedIn, CV yolları |
| `src/data/i18n.js` | `STRINGS`, `pickLang`, `t`, `line`, `loc`, `applyI18n` |
| `src/scene/stage.js` | `coverScale`, `stageOffsetY`, `initStage`, `NARROW_QUERY` |
| `src/scene/room.svg.js` | `SKY_SVG`, `WALL_SVG`, `ROOM_SVG`, `FRONT_SVG`, `SLOTS`, `OBJECTS` |
| `src/scene/parallax.js` | `initParallax` |
| `src/scene/daycycle.js` | `SLICES`, `sliceForHour`, `nextSlice`, `applySlice` |
| `src/scene/particles.js` | `initParticles` (toz + ateş böceği canvas'ı) |
| `src/bmo/bmo.svg.js` | `BMO_SVG`, `BMO_POS`, `SCREEN_RECT` |
| `src/bmo/faces.js` | `FACES`, `createFace` |
| `src/bmo/behavior.js` | `initBehavior` (kırpma, bakış, bacak, boşta) |
| `src/tapes/tape.js` | `tapeHTML`, `createTapes`, `placeTapes`, sürükleme |
| `src/tapes/choreo.js` | `insertTape`, `ejectTape`, `missTape` |
| `src/ui/speech.js` | `createSpeech` |
| `src/ui/screen.js` | `cameraFor`, `renderScreen`, `createScreen` |
| `src/ui/topbar.js` | `initTopbar` |
| `src/ui/listview.js` | `renderList`, `initListview` |
| `src/ui/loader.js` | `runLoader` |
| `src/audio/sfx.js` | `createSfx`, `tuneFor` |
| `src/styles/tokens.css` | Renk/font tokenları + gün dilimi paletleri |
| `src/styles/scene.css` | Sahne, katmanlar, SVG sınıfları, kasetler |
| `src/styles/ui.css` | Üst çubuk, balon, raf, yükleyici, altbilgi |
| `src/styles/screen.css` | BMO ekranı katmanı |
| `src/styles/listview.css` | Hızlı görünüm |
| `public/favicon.svg`, `public/og-image.png`, `public/shots/` | Statik dosyalar |
| `tests/unit/*.test.js`, `tests/e2e/*.spec.js` | Testler |

**Olay sözlüğü (`bus`)** — bütün görevler bu adları kullanır:

| Olay | Detay | Yayan → Dinleyen |
|---|---|---|
| `say` | `string` | herkes → speech |
| `face` | `{ base?: string, flash?: string, ms?: number }` | herkes → faces |
| `sfx` | `string` (ses adı) | herkes → sfx |
| `reach` | `boolean` | main (sürükleme) / choreo → behavior (kollar, yuva parıltısı, aç yüz) |
| `tape:loaded` | `project` | choreo → main (chiptune başlar) |
| `tape:ejected` | `project` | choreo → main (chiptune durur) |
| `screen:closed` | — | screen → main: kullanıcı ⏏ / Esc / dışarı tıklama ile kapatmak istedi → `eject()` |
| `lang:change` | `"tr" \| "en"` | topbar → main, listview, objects |
| `slice:change` | `SLICES[n]` | topbar → (dinleyen yok; parçacıklar `state.slice`'ı her karede okur) |
| `sound:change` | `boolean` | topbar → sfx |

Ayrıca DOM olayı `tape:pick` (kaset sürüklenmeye başlayınca `document`'a kabarır) → main `sfx("pick")`. Düzen değişimi olay değil: `initStage`'in `onLayout` geri çağrısı `state.narrow`'u günceller, kasetler `matchMedia` değişiminde yeniden yerleşir, ekran `resize`'da `relayout()` olur.

---

### Task 1: Proje iskeleti, durum ve güvenli depolama

**Files:**
- Create: `package.json`, `vite.config.js`, `.gitignore` (zaten var — dokunma)
- Replace: `index.html` (eski sürüm git geçmişinde `de83cff`)
- Create: `src/main.js`, `src/state.js`, `src/styles/tokens.css`, `src/styles/scene.css`, `src/styles/ui.css`, `src/styles/screen.css`, `src/styles/listview.css`
- Test: `tests/unit/state.test.js`

**Interfaces:**
- Produces: `createBus(): { on(type, fn): () => void, emit(type, detail?): void }`, `bus`, `state = { current: null, busy: false, lang: "tr", sound: false, slice: "noon", narrow: false, zoomed: false }`, `store = { get(key): string|null, set(key, value): void }`
- Produces: `index.html` içindeki ID'ler: `loader`, `room`, `stage`, `camera`, `l0`, `l1`, `l2`, `l3`, `topbar`, `btnList`, `btnLang`, `btnTime`, `btnSound`, `speech`, `speechText`, `speechHint`, `live`, `tray`, `screenBackdrop`, `screenUi`, `listview`, `fanart`

- [ ] **Step 1: Araçları kur**

`package.json`:
```json
{
  "name": "bmo-agac-ev",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "test": "vitest run",
    "e2e": "playwright test"
  },
  "dependencies": {
    "gsap": "3.15.0"
  },
  "devDependencies": {
    "@playwright/test": "1.64.1",
    "jsdom": "30.1.3",
    "vite": "8.3.4",
    "vitest": "5.0.5"
  }
}
```

`vite.config.js`:
```js
import { defineConfig } from "vite";

export default defineConfig({
  test: { environment: "jsdom", include: ["tests/unit/**/*.test.js"] },
});
```

Run: `npm install`
Expected: `added N packages`, hata yok.

- [ ] **Step 2: Başarısız testi yaz**

`tests/unit/state.test.js`:
```js
import { describe, it, expect, vi, afterEach } from "vitest";
import { createBus, store } from "../../src/state.js";

describe("createBus", () => {
  it("dinleyiciye detayı iletir", () => {
    const b = createBus(); const fn = vi.fn();
    b.on("x", fn); b.emit("x", { a: 1 });
    expect(fn).toHaveBeenCalledWith({ a: 1 });
  });
  it("on() dönen fonksiyon aboneliği kaldırır", () => {
    const b = createBus(); const fn = vi.fn();
    const off = b.on("x", fn); off(); b.emit("x");
    expect(fn).not.toHaveBeenCalled();
  });
  it("dinleyicisi olmayan olay hata vermez", () => {
    expect(() => createBus().emit("yok")).not.toThrow();
  });
});

describe("store", () => {
  afterEach(() => vi.restoreAllMocks());
  it("yazar ve okur", () => {
    store.set("k", "v");
    expect(store.get("k")).toBe("v");
  });
  it("localStorage hata fırlatırsa null döner ve sessiz kalır", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(store.get("k")).toBeNull();
    expect(() => store.set("k", "v")).not.toThrow();
  });
});
```

- [ ] **Step 3: Testin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/state.test.js`
Expected: FAIL — `Failed to resolve import "../../src/state.js"`

- [ ] **Step 4: `src/state.js` yaz**

```js
/* Modüller arası olay yayıcı + paylaşılan uygulama durumu */
export function createBus() {
  const map = new Map();
  return {
    on(type, fn) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type).add(fn);
      return () => map.get(type).delete(fn);
    },
    emit(type, detail) {
      (map.get(type) || []).forEach((fn) => fn(detail));
    },
  };
}

export const bus = createBus();

export const state = {
  current: null,   // takılı proje
  busy: false,     // koreografi sürüyor mu
  lang: "tr",
  sound: false,
  slice: "noon",
  narrow: false,
  zoomed: false,
};

/* gizli modda / engelli depolamada sessizce varsayılana düşer */
export const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* yok say */ } },
};
```

- [ ] **Step 5: Testin geçtiğini gör**

Run: `npx vitest run tests/unit/state.test.js`
Expected: PASS (5 test)

- [ ] **Step 6: `index.html` iskeletini yaz (eskisinin yerine)**

```html
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Erdem — Portfolyo</title>
  <meta name="description" content="Erdem'in projeleri: web, mobil oyun ve IoT. BMO'nun ağaç evinde bir kaset tak, projeyi keşfet.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Erdem — Portfolyo">
  <meta property="og:description" content="BMO'nun ağaç evinde bir kaset tak, projeyi keşfet.">
  <meta property="og:image" content="/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#a8703f">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Nunito:wght@500;700;800&family=VT323&display=swap">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Person","name":"Erdem","jobTitle":"Bilgisayar Mühendisliği Öğrencisi","affiliation":{"@type":"CollegeOrUniversity","name":"Mersin Üniversitesi"},"knowsAbout":["Web","Unity","Mobil Oyun","IoT"]}
  </script>
</head>
<body>
  <div class="loader" id="loader" aria-hidden="true"><div class="loader-screen"><span>LOADING</span><i><b id="loaderBar"></b></i></div></div>

  <!-- üst çubuk sahneden önce: Tab sırası üst çubuk → kasetler → nesneler -->
  <header class="topbar" id="topbar">
    <div class="sign"><div class="plank"><h1>Erdem</h1><p data-i18n="tagline"></p></div></div>
    <nav class="tools">
      <button type="button" class="tool" id="btnList" data-i18n-aria="list"><span aria-hidden="true">📋</span> <span class="lbl" data-i18n="list"></span></button>
      <button type="button" class="tool" id="btnLang" aria-label="Language / Dil">TR</button>
      <button type="button" class="tool" id="btnTime" data-i18n-aria="time_aria">☀</button>
      <button type="button" class="tool" id="btnSound" aria-pressed="false" data-i18n-aria="sound_aria">🔇</button>
    </nav>
  </header>

  <main class="room" id="room">
    <div class="stage" id="stage">
      <div class="camera" id="camera">
        <div class="layer" id="l0" data-depth="0.2"></div>
        <div class="layer" id="l1" data-depth="0.4"></div>
        <div class="layer" id="l2" data-depth="0.7"></div>
        <div class="layer" id="l3" data-depth="1.3"></div>
      </div>
      <div class="tint"></div>
      <div class="vignette"></div>
    </div>
  </main>

  <div class="speech" id="speech" aria-hidden="true"><p id="speechText"></p><small id="speechHint" data-i18n="hint"></small></div>
  <p class="sr-only" id="live" aria-live="polite"></p>

  <div class="tray" id="tray" data-i18n-aria="tray_aria"></div>

  <div class="screen-backdrop" id="screenBackdrop" hidden></div>
  <section class="screen-ui" id="screenUi" role="dialog" aria-modal="true" aria-labelledby="sTitle" hidden></section>

  <section class="listview" id="listview" aria-labelledby="lvTitle" hidden></section>

  <footer class="fanart" id="fanart" data-i18n="footer_note"></footer>

  <noscript>
    <div class="noscript">
      <h1>Erdem — Portfolyo</h1>
      <p>Mersin Üniversitesi Bilgisayar Mühendisliği öğrencisi. Projeler: 81 Okey (Unity mobil oyun), TBH Trade (Steam pazar aracı), Sanal Davetiyecim (dijital davetiye girişimi), Radar Mayın (mobil bulmaca), ESP32 İstasyon (IoT), JARVIS (sesli asistan).</p>
    </div>
  </noscript>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 7: Tokenları ve temel stilleri yaz**

`src/styles/tokens.css`:
```css
:root {
  color-scheme: light;
  --ink: #2b1a12;
  --paper: #f6ead0;
  --f-hand: "Gochi Hand", "Comic Sans MS", cursive;
  --f-term: "VT323", ui-monospace, Menlo, monospace;
  --f-body: "Nunito", system-ui, sans-serif;

  /* sabit nesne renkleri */
  --wood: #b97a45; --wood-dk: #7d4a27;
  --couch: #86b04a; --couch-dk: #5f8a34; --cush1: #e8925c; --cush2: #e9c46a;
  --rug: #c9574a; --rug-dk: #8e3a31;
  --gold: #f2c230; --gold-dk: #c08a12;
  --pack: #4f9a4a; --pack-dk: #356e32; --hat: #fbf7ee;
  --viola: #c4612e; --viola-dk: #8a3d17;
  --book: #3d6f8f; --gem: #e04a6a;
  --leaf: #5aa046; --leaf-dk: #3e7a32; --pot: #c8693c;
  --b1: #d9534f; --b2: #4f86c6; --b3: #e9b949; --b4: #7cae5a;
  --bmo: #6cc9b5; --bmo-dk: #4aa592; --bmo-screen: #c9f2c7; --bmo-face: #1f3b33;
  --dpad: #f3c83a; --tri: #3a8fd6; --btn-g: #5cc45a; --btn-r: #e2453c;
  --phos: #2d5a3c;

  /* gün dilimine göre değişenler — varsayılan: öğle */
  --sky: #8fd3f4; --sky2: #c3ecff; --hill: #7cc35e; --hill2: #a6d97a; --sun: #ffe27a;
  --wall: #c98d55; --wall-dk: #a26a3a; --floor: #d39a5e; --floor-dk: #a8703f;
  --beam-a: .45; --lamp: .25; --stars: 0; --moon: 0; --tint: 0; --tint-c: #1b1a4a;
}
.t-morning { --sky: #bfe3f2; --sky2: #ffe6c4; --sun: #fff0b0; --beam-a: .38; --lamp: .2; --tint: .05; --tint-c: #ffcf8a; }
.t-sunset  { --sky: #f59a6b; --sky2: #ffd08a; --hill: #8a9b4e; --hill2: #b6a85a; --sun: #ffb04a; --wall: #c4804c; --beam-a: .5; --lamp: .6; --tint: .12; --tint-c: #c2502a; }
.t-night   { --sky: #1c2350; --sky2: #2c3570; --hill: #28465a; --hill2: #355a6a; --sun: #f3f1d8; --wall: #7c5638; --wall-dk: #5c3d26; --floor: #86603e; --floor-dk: #654529; --beam-a: 0; --lamp: 1; --stars: 1; --moon: 1; --tint: .28; --tint-c: #141a48; }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
```

`src/styles/scene.css` (bu görevde yalnızca temel; Görev 4–8 ekler):
```css
html, body { height: 100%; margin: 0; }
body { background: var(--floor-dk); color: var(--paper); font-family: var(--f-body); overflow: hidden; overscroll-behavior: none; -webkit-user-select: none; user-select: none; transition: background-color .6s; }
.room { position: fixed; inset: 0; overflow: hidden; }
.stage { position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px; transform-origin: center; }
.camera { position: absolute; inset: 0; transform-origin: 0 0; }
.layer { position: absolute; inset: 0; }
.layer > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.tint { position: absolute; inset: 0; pointer-events: none; background: var(--tint-c); opacity: var(--tint); mix-blend-mode: multiply; transition: opacity .6s, background-color .6s; }
.vignette { position: absolute; inset: -2px; pointer-events: none; background: radial-gradient(ellipse 75% 70% at 50% 55%, transparent 55%, rgba(28, 10, 3, .5)); }
```

`src/styles/ui.css`, `src/styles/screen.css`, `src/styles/listview.css`: bu adımda boş dosya olarak oluştur (ilgili görevler doldurur).

`src/main.js`:
```js
import "./styles/tokens.css";
import "./styles/scene.css";
import "./styles/ui.css";
import "./styles/screen.css";
import "./styles/listview.css";
```

- [ ] **Step 8: Derlemeyi doğrula**

Run: `npm run build`
Expected: `✓ built in …`, `dist/index.html` oluşur, hata yok.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html src tests
git commit -m "Vite iskeleti, olay yayıcı ve güvenli depolama

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: İçerik verisi ve dil sistemi

**Files:**
- Create: `src/data/projects.json`, `src/data/projects.js`, `src/data/profile.js`, `src/data/i18n.js`
- Test: `tests/unit/projects.test.js`, `tests/unit/i18n.test.js`

**Interfaces:**
- Consumes: —
- Produces:
  - `PROJECTS: Project[]`, `STATUSES = ["live","dev","design","planning"]`
  - `validateProjects(list): string[]` (hata mesajları; boşsa geçerli)
  - `usableLinks(project): {label,url}[]` (boş ve `#` url'leri eler)
  - `assignSlots(list, slots): { placed: {project, slot, index}[], overflow: Project[] }`
  - `PROFILE = { name, email, github, linkedin, cv: { tr, en } }` (boş string = yok)
  - `STRINGS`, `pickLang(saved, navLang): "tr"|"en"`, `t(lang, key): string|string[]`, `line(lang, key, rand?): string`, `loc(lang, obj): string`, `fmt(str, vars): string`, `applyI18n(root, lang): void`
  - `Project = { id, status, color:{shell,label}, title:{tr,en}, kind:{tr,en}, desc:{tr,en}, line:{tr,en}, stack:string[], shots:string[], links:{label,url}[] }`

- [ ] **Step 1: Başarısız testleri yaz**

`tests/unit/projects.test.js`:
```js
import { describe, it, expect } from "vitest";
import { PROJECTS, validateProjects, usableLinks, assignSlots } from "../../src/data/projects.js";

describe("PROJECTS", () => {
  it("7 proje içerir ve hepsi geçerli", () => {
    expect(PROJECTS).toHaveLength(7);
    expect(validateProjects(PROJECTS)).toEqual([]);
  });
  it("id'ler benzersiz", () => {
    expect(new Set(PROJECTS.map((p) => p.id)).size).toBe(PROJECTS.length);
  });
});

describe("validateProjects", () => {
  it("eksik zorunlu alanı ve geçersiz durumu raporlar", () => {
    const errs = validateProjects([{ id: "x", status: "bozuk", title: { tr: "X" } }]);
    expect(errs.some((e) => e.includes("'color'"))).toBe(true);
    expect(errs.some((e) => e.includes("status"))).toBe(true);
  });
  it("TR metni olmayan çok dilli alanı raporlar", () => {
    const p = { ...PROJECTS[0], title: { en: "Only EN" } };
    expect(validateProjects([p]).some((e) => e.includes("title.tr"))).toBe(true);
  });
});

describe("usableLinks", () => {
  it("boş ve # bağlantıları eler", () => {
    const p = { links: [{ label: "a", url: "" }, { label: "b", url: "#" }, { label: "c", url: "https://c.dev" }] };
    expect(usableLinks(p)).toEqual([{ label: "c", url: "https://c.dev" }]);
  });
  it("links alanı yoksa boş dizi döner", () => {
    expect(usableLinks({})).toEqual([]);
  });
});

describe("assignSlots", () => {
  const slots = [{ x: 1 }, { x: 2 }];
  it("projeleri sırayla yuvalara yerleştirir, fazlasını overflow'a koyar", () => {
    const r = assignSlots([{ id: "a" }, { id: "b" }, { id: "c" }], slots);
    expect(r.placed.map((e) => e.project.id)).toEqual(["a", "b"]);
    expect(r.placed[1].slot).toBe(slots[1]);
    expect(r.overflow.map((p) => p.id)).toEqual(["c"]);
  });
});
```

`tests/unit/i18n.test.js`:
```js
import { describe, it, expect } from "vitest";
import { pickLang, t, line, loc, fmt, applyI18n, STRINGS } from "../../src/data/i18n.js";

describe("pickLang", () => {
  it("kayıtlı dil her şeyden önce gelir", () => expect(pickLang("en", "tr-TR")).toBe("en"));
  it("kayıt yoksa tr ile başlayan tarayıcı dili TR verir", () => expect(pickLang(null, "tr-TR")).toBe("tr"));
  it("diğer her durumda EN", () => {
    expect(pickLang(null, "de-DE")).toBe("en");
    expect(pickLang("xx", undefined)).toBe("en");
  });
});

describe("t / line / loc / fmt", () => {
  it("EN'de olmayan anahtar TR'ye düşer", () => {
    STRINGS.tr.__test = "sadece tr";
    expect(t("en", "__test")).toBe("sadece tr");
    delete STRINGS.tr.__test;
  });
  it("hiç olmayan anahtar anahtarın kendisini döner", () => expect(t("tr", "yok_boyle")).toBe("yok_boyle"));
  it("line dizi anahtarından rand ile seçer", () => {
    const arr = t("tr", "idle");
    expect(line("tr", "idle", () => 0)).toBe(arr[0]);
  });
  it("loc dil yoksa tr'yi döner", () => expect(loc("en", { tr: "Merhaba" })).toBe("Merhaba"));
  it("fmt {ad} yer tutucularını doldurur", () => expect(fmt("{t} kaseti", { t: "Okey" })).toBe("Okey kaseti"));
});

describe("applyI18n", () => {
  it("data-i18n metnini ve data-i18n-aria etiketini doldurur", () => {
    document.body.innerHTML = `<p data-i18n="list"></p><button data-i18n-aria="sound_aria"></button>`;
    applyI18n(document.body, "en");
    expect(document.querySelector("p").textContent).toBe(STRINGS.en.list);
    expect(document.querySelector("button").getAttribute("aria-label")).toBe(STRINGS.en.sound_aria);
  });
});
```

- [ ] **Step 2: Testlerin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/projects.test.js tests/unit/i18n.test.js`
Expected: FAIL — modüller bulunamıyor.

- [ ] **Step 3: `src/data/projects.json` yaz**

```json
[
  {
    "id": "hakkimda", "status": "live",
    "color": { "shell": "#efe2c4", "label": "#d9774a" },
    "title": { "tr": "Hakkımda", "en": "About Me" },
    "kind": { "tr": "Tanışma", "en": "Introduction" },
    "desc": {
      "tr": "Mersin Üniversitesi Bilgisayar Mühendisliği 2. sınıf öğrencisiyim. Güçlü bir web geliştirme altyapım var; fikirleri ürüne dönüştürüp yayına almayı seviyorum. Web, mobil oyun ve donanım projeleri arasında geziyorum.",
      "en": "I'm a second-year Computer Engineering student at Mersin University. I have a strong web development background and love turning ideas into shipped products. I move between web, mobile games and hardware projects."
    },
    "line": { "tr": "Bu kaset sahibimi anlatıyor. Erdem ile tanış!", "en": "This tape is all about my owner. Meet Erdem!" },
    "stack": ["Web", "Unity", "Mobil", "IoT"], "shots": [],
    "links": [{ "label": "GitHub", "url": "" }, { "label": "LinkedIn", "url": "" }]
  },
  {
    "id": "okey", "status": "dev",
    "color": { "shell": "#4a3a36", "label": "#e2b04a" },
    "title": { "tr": "81 Okey", "en": "81 Okey" },
    "kind": { "tr": "Mobil Oyun", "en": "Mobile Game" },
    "desc": {
      "tr": "Web tabanlı Türk okey oyunu 81 Okey'in Unity ile mobil uygulamaya dönüştürülmesi. Oyun mantığı, çok oyunculu akış ve mobil arayüz yeniden kuruluyor.",
      "en": "Porting the web-based Turkish okey game 81 Okey to a mobile app with Unity. Game logic, multiplayer flow and the mobile UI are being rebuilt."
    },
    "line": { "tr": "Taşlar dizildi, 81 Okey çalıyor. Masaya otur bakalım!", "en": "Tiles are set, 81 Okey is playing. Pull up a chair!" },
    "stack": ["Unity", "C#", "Web → Mobil"], "shots": [],
    "links": [{ "label": "alazgame.com", "url": "https://alazgame.com" }]
  },
  {
    "id": "tbh", "status": "live",
    "color": { "shell": "#3d5560", "label": "#6f98b8" },
    "title": { "tr": "TBH Trade", "en": "TBH Trade" },
    "kind": { "tr": "Web Aracı", "en": "Web Tool" },
    "desc": {
      "tr": "TBH: Task Bar Hero oyunu için Steam pazarında kârlılık hesaplayan araç. Eşya fiyatlarını karşılaştırıp hangi işlemin kazandırdığını gösteriyor.",
      "en": "A profit calculator for the Steam market of the game TBH: Task Bar Hero. It compares item prices and shows which trades pay off."
    },
    "line": { "tr": "TBH Trade yüklendi. Steam pazarında kâr peşindeyiz!", "en": "TBH Trade loaded. We're hunting profit on the Steam market!" },
    "stack": ["JavaScript", "Steam Market", "Hesaplama"], "shots": [],
    "links": [{ "label": "Canlı Demo", "url": "" }]
  },
  {
    "id": "davetiye", "status": "live",
    "color": { "shell": "#efe2c4", "label": "#c97a9a" },
    "title": { "tr": "Sanal Davetiyecim", "en": "Sanal Davetiyecim" },
    "kind": { "tr": "Girişim", "en": "Startup" },
    "desc": {
      "tr": "Dijital davetiye hizmeti. Düğün, nişan ve etkinlikler için paylaşılabilir davetiye sayfaları; marka kimliği ve pazarlama çalışmaları dahil.",
      "en": "A digital invitation service: shareable invitation pages for weddings, engagements and events, including brand identity and marketing work."
    },
    "line": { "tr": "Sanal Davetiyecim çalıyor. Davetlisiniz efendim!", "en": "Sanal Davetiyecim is playing. You're invited!" },
    "stack": ["Web", "Marka", "Pazarlama"], "shots": [],
    "links": [{ "label": "sanaldavetiyecim.com", "url": "https://sanaldavetiyecim.com" }]
  },
  {
    "id": "radar", "status": "design",
    "color": { "shell": "#4a3a36", "label": "#8fae5a" },
    "title": { "tr": "Radar Mayın", "en": "Radar Mines" },
    "kind": { "tr": "Mobil Bulmaca", "en": "Mobile Puzzle" },
    "desc": {
      "tr": "Mayın tarlasının gemili versiyonu: hareket eden radar penceresi ve yakıt sistemiyle her hamle bir karar. Tasarım ve planlama aşamasında.",
      "en": "Minesweeper with a ship: a moving radar window and a fuel system make every move a decision. In design and planning."
    },
    "line": { "tr": "Radar açık, yakıt sınırlı. Mayınlara dikkat kaptan!", "en": "Radar on, fuel low. Watch out for mines, captain!" },
    "stack": ["Oyun Tasarımı", "Mobil"], "shots": [], "links": []
  },
  {
    "id": "esp32", "status": "dev",
    "color": { "shell": "#5b3f5e", "label": "#b48cc4" },
    "title": { "tr": "ESP32 İstasyon", "en": "ESP32 Station" },
    "kind": { "tr": "IoT · Ders Projesi", "en": "IoT · Course Project" },
    "desc": {
      "tr": "Kablosuz ve Mobil Ağlar dersi için ESP32 tabanlı hava istasyonu ve uzaktan alarm sistemi. Sensör verisi kablosuz olarak toplanıp izleniyor.",
      "en": "An ESP32-based weather station and remote alarm system for the Wireless and Mobile Networks course. Sensor data is collected and monitored over Wi-Fi."
    },
    "line": { "tr": "Sensörler okunuyor... bugün hava kodlamaya müsait.", "en": "Reading sensors... perfect weather for coding today." },
    "stack": ["ESP32", "C++", "Sensörler", "Wi-Fi"], "shots": [], "links": []
  },
  {
    "id": "jarvis", "status": "planning",
    "color": { "shell": "#3f5a48", "label": "#4e9c8f" },
    "title": { "tr": "JARVIS", "en": "JARVIS" },
    "kind": { "tr": "Sesli Asistan", "en": "Voice Assistant" },
    "desc": {
      "tr": "Kendi sesli kişisel asistanım: komutları dinleyen, işleri otomatikleştiren bir yardımcı. Hedefler ve platform kararları netleşiyor.",
      "en": "My own voice assistant: a helper that listens to commands and automates tasks. Goals and platform decisions are taking shape."
    },
    "line": { "tr": "Sesli asistan kaseti. Belki bir gün ben de onun gibi konuşurum!", "en": "A voice assistant tape. Maybe one day I'll talk like that too!" },
    "stack": ["Ses Tanıma", "Otomasyon"], "shots": [], "links": []
  }
]
```

- [ ] **Step 4: `src/data/projects.js` yaz**

```js
import raw from "./projects.json";

export const STATUSES = ["live", "dev", "design", "planning"];
const REQUIRED = ["id", "status", "color", "title", "kind", "desc", "line"];
const LOCALIZED = ["title", "kind", "desc", "line"];

export function validateProjects(list) {
  const errors = [];
  list.forEach((p, i) => {
    const tag = `#${i} ${p.id ?? "?"}`;
    REQUIRED.forEach((f) => { if (p[f] == null) errors.push(`${tag}: '${f}' eksik`); });
    if (p.status != null && !STATUSES.includes(p.status)) errors.push(`${tag}: status '${p.status}' geçersiz`);
    LOCALIZED.forEach((f) => { if (p[f] && !p[f].tr) errors.push(`${tag}: '${f}.tr' eksik`); });
  });
  return errors;
}

export function usableLinks(p) {
  return (p.links || []).filter((l) => l.url && l.url !== "#");
}

export function assignSlots(list, slots) {
  return {
    placed: list.slice(0, slots.length).map((project, index) => ({ project, slot: slots[index], index })),
    overflow: list.slice(slots.length),
  };
}

export const PROJECTS = raw;

if (import.meta.env?.DEV) validateProjects(raw).forEach((m) => console.error("[projects]", m));
```

- [ ] **Step 5: `src/data/profile.js` yaz**

```js
/* Kişisel bilgiler — boş string "henüz yok" demek; arayüz o öğeyi gizler. */
export const PROFILE = {
  name: "Erdem",
  email: "",
  github: "",
  linkedin: "",
  cv: { tr: "", en: "" }, // örn. "/cv-tr.pdf"
};
```

- [ ] **Step 6: `src/data/i18n.js` yaz**

```js
export const STRINGS = {
  tr: {
    tagline: "Bilgisayar Müh. · Web & Oyun",
    hint: "[sürükle] kaseti BMO'ya tak · [tıkla] hızlı oynat",
    list: "Liste",
    time_aria: "Gün saatini değiştir",
    sound_aria: "Sesi aç/kapat",
    tray_aria: "Kasetler",
    tape_aria: "{t} kasetini oynat",
    loading: "Yükleniyor",
    welcome: "Merhaba! Ben BMO! Erdem'in projeleri bu kasetlerde. Birini kapıp bana tak!",
    empty: "Karnım boş! Bir kaseti sürükleyip bana tak.",
    ejected: "Kaset çıktı. Sıradaki hangisi?",
    miss: "Aww... ıskaladın. Tam buraya, yuvama!",
    idle: ["♪ hmm hmm hmm ♪", "Finn ile Jake yine maceraya gitti...", "Kim oyun oynamak ister?", "Bip bop! Kasetler beni bekliyor."],
    click: ["Hihihi! Gıdıklanıyorum!", "Ben BMO! Seninle oynayabilir miyim?", "Bir kaset tak, sana bir şey göstereyim!"],
    obj_hat: "Finn'in şapkası! Onsuz maceraya çıkmaz.",
    obj_viola: "Jake'in violası! ♪ Ding ding ding ♪",
    obj_sword: "Altın kılıç. Dokunma, Finn kızar!",
    obj_book: "Enchiridion! Kahramanlar için bir el kitabı.",
    obj_gold: "Hazine! Jake bunları sayarken uyuyakalmıştı.",
    status_live: "Yayında", status_dev: "Geliştiriliyor", status_design: "Tasarım", status_planning: "Planlama",
    side: "SIDE A",
    eject: "⏏ Çıkar",
    close: "Kapat",
    shots: "Ekran görüntüleri",
    list_title: "Erdem — Projeler",
    list_back: "✕ Odaya dön",
    cv: "CV indir (PDF)",
    contact: "İletişim",
    projects: "Projeler",
    footer_note: "BMO fan-art'ıdır. Adventure Time © Cartoon Network.",
  },
  en: {
    tagline: "Computer Eng. · Web & Games",
    hint: "[drag] a tape into BMO · [click] quick play",
    list: "List",
    time_aria: "Change time of day",
    sound_aria: "Toggle sound",
    tray_aria: "Tapes",
    tape_aria: "Play the {t} tape",
    loading: "Loading",
    welcome: "Hi! I'm BMO! Erdem's projects are on these tapes. Grab one and put it in me!",
    empty: "My tummy is empty! Drag a tape into me.",
    ejected: "Tape out. Which one's next?",
    miss: "Aww... you missed. Right here, in my slot!",
    idle: ["♪ hmm hmm hmm ♪", "Finn and Jake went on another adventure...", "Who wants to play video games?", "Beep boop! The tapes are waiting."],
    click: ["Hehehe! That tickles!", "I am BMO! Can I play with you?", "Put in a tape, I'll show you something!"],
    obj_hat: "Finn's hat! He never goes adventuring without it.",
    obj_viola: "Jake's viola! ♪ Ding ding ding ♪",
    obj_sword: "The golden sword. Don't touch, Finn will be mad!",
    obj_book: "The Enchiridion! A handbook for heroes.",
    obj_gold: "Treasure! Jake fell asleep counting it.",
    status_live: "Live", status_dev: "In development", status_design: "Design", status_planning: "Planning",
    side: "SIDE A",
    eject: "⏏ Eject",
    close: "Close",
    shots: "Screenshots",
    list_title: "Erdem — Projects",
    list_back: "✕ Back to the room",
    cv: "Download CV (PDF)",
    contact: "Contact",
    projects: "Projects",
    footer_note: "BMO is fan art. Adventure Time © Cartoon Network.",
  },
};

export function pickLang(saved, navLang) {
  if (saved === "tr" || saved === "en") return saved;
  return String(navLang || "").toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function t(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS.tr[key] ?? key;
}

export function line(lang, key, rand = Math.random) {
  const v = t(lang, key);
  return Array.isArray(v) ? v[Math.floor(rand() * v.length)] : v;
}

export function loc(lang, obj) {
  return obj?.[lang] ?? obj?.tr ?? "";
}

export function fmt(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export function applyI18n(root, lang) {
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(lang, el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(lang, el.dataset.i18nAria)); });
}
```

- [ ] **Step 7: Testlerin geçtiğini gör**

Run: `npx vitest run`
Expected: PASS (tüm birim testler)

- [ ] **Step 8: Commit**

```bash
git add src/data tests/unit
git commit -m "Proje verisi (TR/EN), profil ve dil sistemi

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Gün/gece döngüsü

**Files:**
- Create: `src/scene/daycycle.js`
- Test: `tests/unit/daycycle.test.js`

**Interfaces:**
- Produces: `SLICES = ["morning","noon","sunset","night"]`, `sliceForHour(h: 0–23): Slice`, `nextSlice(s): Slice`, `applySlice(rootEl, slice): void` (rootEl'e `t-<slice>` sınıfını koyar, diğerlerini kaldırır)

- [ ] **Step 1: Başarısız testi yaz**

`tests/unit/daycycle.test.js`:
```js
import { describe, it, expect } from "vitest";
import { sliceForHour, nextSlice, applySlice, SLICES } from "../../src/scene/daycycle.js";

describe("sliceForHour", () => {
  it.each([
    [5, "night"], [6, "morning"], [10, "morning"], [11, "noon"],
    [16, "noon"], [17, "sunset"], [19, "sunset"], [20, "night"], [0, "night"], [23, "night"],
  ])("%i:xx → %s", (h, s) => expect(sliceForHour(h)).toBe(s));
});

describe("nextSlice", () => {
  it("sırayla döner ve geceden sabaha sarar", () => {
    expect(nextSlice("morning")).toBe("noon");
    expect(nextSlice("night")).toBe("morning");
  });
});

describe("applySlice", () => {
  it("yalnızca seçili dilim sınıfını bırakır", () => {
    const el = document.createElement("html");
    applySlice(el, "night"); applySlice(el, "sunset");
    expect(el.classList.contains("t-sunset")).toBe(true);
    expect(SLICES.filter((s) => el.classList.contains("t-" + s))).toEqual(["sunset"]);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/daycycle.test.js`
Expected: FAIL — modül bulunamıyor.

- [ ] **Step 3: `src/scene/daycycle.js` yaz**

```js
export const SLICES = ["morning", "noon", "sunset", "night"];

export function sliceForHour(h) {
  if (h >= 6 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "noon";
  if (h >= 17 && h < 20) return "sunset";
  return "night";
}

export function nextSlice(s) {
  return SLICES[(SLICES.indexOf(s) + 1) % SLICES.length];
}

export function applySlice(root, slice) {
  SLICES.forEach((s) => root.classList.toggle("t-" + s, s === slice));
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run tests/unit/daycycle.test.js`
Expected: PASS (13 test)

- [ ] **Step 5: Commit**

```bash
git add src/scene/daycycle.js tests/unit/daycycle.test.js
git commit -m "Gün/gece dilimi hesaplama

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Sahne — ölçekleme, ağaç ev katmanları, parallax

**Files:**
- Create: `src/scene/stage.js`, `src/scene/room.svg.js`, `src/scene/parallax.js`
- Modify: `src/main.js`, `src/styles/scene.css`
- Test: `tests/unit/stage.test.js`

**Interfaces:**
- Consumes: `applySlice`, `sliceForHour`, `SLICES` (Görev 3), `state` (Görev 1)
- Produces:
  - `W = 1920`, `H = 1080`, `NARROW_QUERY`, `coverScale(vw, vh, narrow): number`, `stageOffsetY(vh, k, narrow): number`
  - `initStage(stageEl, { onLayout(view) }): view` — `view = { k, oy, narrow }` (canlı nesne, her `fit()`'te güncellenir)
  - `SKY_SVG`, `WALL_SVG`, `ROOM_SVG`, `FRONT_SVG` (string)
  - `SLOTS: { x, y, s, r }[]` (10 adet; `x,y` = kasetin alt-orta noktası, sahne px; `s` ölçek; `r` derece)
  - `OBJECTS = ["hat","viola","sword","book","gold"]` — ROOM_SVG'de `<g class="obj" data-obj="…">` olarak bulunur
  - `initParallax(layerEls, state): { reset() }`
  - URL parametresi `?t=<slice>` gün dilimini zorlar (test ve önizleme için)

- [ ] **Step 1: Başarısız testi yaz**

`tests/unit/stage.test.js`:
```js
import { describe, it, expect } from "vitest";
import { coverScale, stageOffsetY, W, H } from "../../src/scene/stage.js";
import { SLOTS, ROOM_SVG, OBJECTS } from "../../src/scene/room.svg.js";

describe("coverScale", () => {
  it("geniş ekranda sahneyi kaplar (+%4 parallax payı)", () => {
    expect(coverScale(1920, 1080, false)).toBeCloseTo(1.04);
    expect(coverScale(2560, 1080, false)).toBeCloseTo((2560 / W) * 1.04);
  });
  it("dar düzende 1.3 kat yakınlaşır", () => {
    expect(coverScale(375, 812, true)).toBeCloseTo((812 / H) * 1.3);
  });
});

describe("stageOffsetY", () => {
  it("geniş düzende kaydırma yok", () => expect(stageOffsetY(900, 1, false)).toBe(0));
  it("dar düzende BMO'nun merkezi ekranın %45'ine gelir", () => {
    const vh = 812, k = coverScale(375, vh, true), oy = stageOffsetY(vh, k, true);
    expect(vh / 2 + oy + (770 - H / 2) * k).toBeCloseTo(0.45 * vh);
  });
});

describe("room", () => {
  it("10 kaset yuvası var ve hepsi güvenli bölgede", () => {
    expect(SLOTS).toHaveLength(10);
    SLOTS.forEach((s) => { expect(s.x).toBeGreaterThanOrEqual(240 + 70); expect(s.x).toBeLessThanOrEqual(1680 - 70); });
  });
  it("her Finn/Jake nesnesi tıklanabilir grup olarak var", () => {
    OBJECTS.forEach((o) => expect(ROOM_SVG).toContain(`data-obj="${o}" role="button"`));
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/stage.test.js`
Expected: FAIL — modüller bulunamıyor.

- [ ] **Step 3: `src/scene/stage.js` yaz**

```js
/* Sahne 1920×1080 tasarım ölçeğinde çizilir ve ekranı "cover" ile doldurur. */
export const W = 1920, H = 1080;
export const NARROW_QUERY = "(max-width: 700px), (orientation: portrait)";
const BMO_CENTER_Y = 770;

export function coverScale(vw, vh, narrow) {
  return Math.max(vw / W, vh / H) * (narrow ? 1.3 : 1.04);
}

/* dar düzende BMO'yu ekranın üst %45'ine taşır (alttaki kaset rafına yer açar) */
export function stageOffsetY(vh, k, narrow) {
  return narrow ? 0.45 * vh - vh / 2 - (BMO_CENTER_Y - H / 2) * k : 0;
}

export function initStage(stageEl, { onLayout } = {}) {
  const mq = matchMedia(NARROW_QUERY);
  const view = { k: 1, oy: 0, narrow: mq.matches };
  function fit() {
    view.narrow = mq.matches;
    view.k = coverScale(innerWidth, innerHeight, view.narrow);
    view.oy = stageOffsetY(innerHeight, view.k, view.narrow);
    stageEl.style.transform = `translate(-50%, calc(-50% + ${view.oy}px)) scale(${view.k})`;
    onLayout?.(view);
  }
  addEventListener("resize", fit);
  mq.addEventListener("change", fit);
  fit();
  return view;
}
```

- [ ] **Step 4: `src/scene/room.svg.js` yaz**

```js
/* Ağaç ev — 4 parallax katmanı. Renkler sınıflarla (c-*) tokenlardan gelir; .o = kalın mürekkep kontur. */

export const SKY_SVG = `
<svg viewBox="0 0 1920 1080" aria-hidden="true">
  <rect class="c-sky" x="-40" y="-40" width="1000" height="1160"/>
  <rect class="c-sky2" x="-40" y="330" width="1000" height="790"/>
  <g class="stars">
    <circle class="c-paper" cx="236" cy="246" r="3"/><circle class="c-paper" cx="300" cy="226" r="2.5"/>
    <circle class="c-paper" cx="372" cy="262" r="3"/><circle class="c-paper" cx="410" cy="318" r="2"/>
    <circle class="c-paper" cx="250" cy="330" r="2"/><circle class="c-paper" cx="342" cy="318" r="2.5"/>
    <circle class="c-paper" cx="420" cy="232" r="2"/><circle class="c-paper" cx="226" cy="290" r="2"/>
  </g>
  <circle class="c-sun o" cx="280" cy="272" r="40"/>
  <circle class="moon-bite" cx="300" cy="258" r="34"/>
  <g class="cloud"><path class="c-paper o" d="M180 312c0-16 14-26 30-22 6-16 32-18 40-2 16-2 26 8 24 24Z"/></g>
  <g class="cloud" style="animation-duration:85s"><path class="c-paper o" d="M330 236c0-12 10-20 22-17 5-12 24-13 30-1 12-1 20 6 18 18Z"/></g>
  <path class="c-hill2 o" d="M140 420c60-50 140-50 200-10 40-30 100-34 160 6V1120H140Z"/>
  <path class="c-hill o" d="M140 452c80-34 160-26 230 4 50-20 90-20 140 2V1120H140Z"/>
</svg>`;

export const WALL_SVG = `
<svg viewBox="0 0 1920 1080" aria-hidden="true">
  <path class="c-wall" fill-rule="evenodd" d="M-40-40H1960V1120H-40Z M210 330a120 120 0 1 0 240 0a120 120 0 1 0-240 0Z"/>
  <path class="c-wall-dk" d="M-40-40H1960V60C1500 150 420 150-40 60Z"/>
  <path class="c-wall-dk" d="M-40-40H130C95 300 105 700 160 1120H-40Z"/>
  <path class="c-wall-dk" d="M1960-40H1790C1825 300 1815 700 1760 1120H1960Z"/>
  <path class="bark" d="M610 130C585 330 590 540 630 770"/>
  <path class="bark" d="M1310 130C1335 330 1330 540 1290 770"/>
  <path class="bark" d="M200 520C180 640 190 720 230 800"/>
  <path class="bark" d="M1720 170C1740 300 1735 420 1710 520"/>
  <ellipse class="ring" cx="860" cy="300" rx="74" ry="40"/>
  <ellipse class="ring" cx="860" cy="300" rx="44" ry="22"/>
  <ellipse class="c-wall-dk o" cx="1470" cy="250" rx="34" ry="22"/>
  <ellipse class="c-wall" cx="1470" cy="250" rx="15" ry="8"/>
  <!-- yuvarlak pencere -->
  <circle class="win-frame-out" cx="330" cy="330" r="126"/>
  <circle class="win-frame" cx="330" cy="330" r="126"/>
  <path class="win-bar-out" d="M330 210V450M210 330H450"/>
  <path class="win-bar" d="M330 210V450M210 330H450"/>
  <rect class="c-wood o" x="180" y="458" width="300" height="26" rx="8"/>
  <path class="c-pot o" d="M392 458l8-52h56l8 52Z"/>
  <path class="c-leaf o" d="M428 408c-40-20-46-60-30-76 20 10 34 40 30 76Z"/>
  <path class="c-leaf-dk o" d="M428 408c30-30 60-34 76-20-14 22-44 30-76 20Z"/>
  <!-- sol üst raf -->
  <rect class="c-b1 o" x="540" y="172" width="34" height="80" rx="4"/>
  <rect class="c-b2 o" x="574" y="160" width="30" height="92" rx="4"/>
  <rect class="c-b3 o" x="604" y="184" width="40" height="68" rx="4"/>
  <rect class="c-b4 o" x="652" y="176" width="28" height="76" rx="4" transform="rotate(8 666 214)"/>
  <rect class="c-wood o" x="520" y="250" width="300" height="22" rx="6"/>
  <path class="c-wood-dk o" d="M548 272v34l30-34Z M792 272v34l-30-34Z"/>
  <!-- asılı saksı -->
  <path class="rope" d="M1180 40L1150 160M1180 40L1210 160"/>
  <path class="c-pot o" d="M1136 160h88l-10 50h-68Z"/>
  <path class="c-leaf o" d="M1150 200c-30 20-40 60-30 90 22-14 34-50 30-90Z"/>
  <path class="c-leaf-dk o" d="M1210 200c30 20 40 60 30 90-22-14-34-50-30-90Z"/>
  <path class="c-leaf o" d="M1180 206c-6 30 0 64 14 84 10-26 4-60-14-84Z"/>
  <!-- merdiven -->
  <path class="rung-out" d="M1584 180h70M1586 260h70M1589 340h69M1591 420h69M1594 500h68M1596 580h68M1598 660h68"/>
  <path class="rung" d="M1584 180h70M1586 260h70M1589 340h69M1591 420h69M1594 500h68M1596 580h68M1598 660h68"/>
  <path class="c-wood o" d="M1560 110h22l20 660h-22Z"/>
  <path class="c-wood o" d="M1650 110h22l-6 660h-22Z"/>
</svg>`;

export const ROOM_SVG = `
<svg class="room-svg" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="glowG"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  </defs>
  <!-- zemin + halı -->
  <path class="c-floor o" d="M-40 770C600 736 1320 736 1960 770V1120H-40Z"/>
  <path class="plank-line" d="M-40 830C620 800 1300 800 1960 830M-40 910C620 878 1300 878 1960 910M-40 1000C620 966 1300 966 1960 1000"/>
  <path class="plank-line" d="M300 760v62M900 750v60M1500 758v62M600 812v76M1200 810v76M420 890v94M1050 882v92M1650 892v100"/>
  <ellipse class="c-rug o" cx="960" cy="985" rx="430" ry="78"/>
  <ellipse class="rug-in" cx="960" cy="985" rx="370" ry="58"/>

  <!-- kanepe -->
  <path class="c-couch o" d="M300 650c0-40 30-64 80-64h280c50 0 80 24 80 64v110H300Z"/>
  <rect class="c-cush1 o" x="350" y="620" width="120" height="96" rx="20" transform="rotate(-7 410 668)"/>
  <rect class="c-cush2 o" x="570" y="622" width="120" height="96" rx="20" transform="rotate(6 630 670)"/>
  <rect class="c-couch o" x="290" y="740" width="460" height="74" rx="28"/>
  <rect class="c-couch-dk o" x="258" y="672" width="74" height="160" rx="32"/>
  <rect class="c-couch-dk o" x="708" y="672" width="74" height="160" rx="32"/>
  <rect class="c-wood-dk o" x="300" y="828" width="22" height="34" rx="5"/>
  <rect class="c-wood-dk o" x="718" y="828" width="22" height="34" rx="5"/>

  <!-- Finn'in sırt çantası (dekor) -->
  <rect class="c-wood-dk o" x="678" y="392" width="44" height="16" rx="6"/>
  <rect class="c-pack o" x="650" y="414" width="100" height="124" rx="24"/>
  <path class="c-pack-dk o" d="M650 462c28 14 72 14 100 0v-22c0-14-12-26-26-26h-48c-14 0-26 12-26 26Z"/>
  <rect class="c-gold o" x="690" y="466" width="20" height="14" rx="3"/>

  <!-- Finn'in şapkası (askıda) -->
  <g class="obj" data-obj="hat" role="button" tabindex="0">
    <rect class="c-wood-dk o" x="558" y="384" width="44" height="16" rx="6"/>
    <circle class="c-hat o" cx="536" cy="418" r="15"/><circle class="c-hat o" cx="624" cy="418" r="15"/>
    <path class="c-hat o" d="M520 490c0-56 26-84 60-84s60 28 60 84v26c0 8-6 12-14 12h-92c-8 0-14-4-14-12Z"/>
    <path class="c-wall-dk o" d="M548 482c0-22 14-34 32-34s32 12 32 34v18h-64Z"/>
    <path class="c-hat o" d="M526 516v34c0 8 14 8 14 0v-34Z M620 516v34c0 8 14 8 14 0v-34Z"/>
  </g>

  <!-- altın kılıç -->
  <g class="obj" data-obj="sword" role="button" tabindex="0" transform="rotate(-28 1090 340)">
    <path class="c-gold o" d="M1082 196h16l8 210h-32Z"/>
    <path class="blade-line" d="M1090 214V392"/>
    <rect class="c-wood-dk o" x="1046" y="404" width="88" height="18" rx="8"/>
    <rect class="c-viola-dk o" x="1080" y="422" width="20" height="46" rx="6"/>
    <circle class="c-gem o" cx="1090" cy="476" r="12"/>
  </g>

  <!-- raf + Enchiridion -->
  <rect class="c-wood o" x="1190" y="470" width="340" height="24" rx="6"/>
  <path class="c-wood-dk o" d="M1220 494v42l34-42Z M1500 494v42l-34-42Z"/>
  <g class="obj" data-obj="book" role="button" tabindex="0">
    <rect class="c-paper o" x="1374" y="386" width="14" height="80" rx="3"/>
    <rect class="c-book o" x="1318" y="380" width="62" height="90" rx="6"/>
    <path class="gold-line" d="M1330 394h38M1330 456h38"/>
    <circle class="c-gem o" cx="1349" cy="425" r="13"/>
  </g>

  <!-- Jake'in violası -->
  <g class="obj" data-obj="viola" role="button" tabindex="0" transform="rotate(14 1500 760)">
    <rect class="c-ink" x="1494" y="560" width="12" height="150" rx="4"/>
    <path class="c-viola-dk o" d="M1488 548c0-18 24-18 24 0v20h-24Z"/>
    <path class="c-viola o" d="M1500 640c-34 0-50 22-44 50 4 20-14 30-14 54s18 34 14 56c-6 32 14 62 44 62s50-30 44-62c-4-22 14-32 14-56s-18-34-14-54c6-28-10-50-44-50Z"/>
    <path class="fhole" d="M1484 708c-4 16 0 30 0 42M1516 708c4 16 0 30 0 42"/>
    <rect class="c-wood-dk" x="1484" y="780" width="32" height="6" rx="2"/>
    <path class="strings" d="M1496 572V840M1500 572V840M1504 572V840"/>
  </g>

  <!-- hazine yığını -->
  <g class="obj" data-obj="gold" role="button" tabindex="0">
    <path class="c-gold o" d="M1430 950c10-50 50-80 90-80s80 30 90 80Z"/>
    <path class="coin-line" d="M1470 920h20M1530 910h22M1500 936h24M1560 930h16"/>
    <circle class="c-gem o" cx="1510" cy="898" r="12"/>
    <ellipse class="c-gold o" cx="1446" cy="948" rx="22" ry="9"/>
    <ellipse class="c-gold o" cx="1600" cy="950" rx="22" ry="9"/>
  </g>

  <!-- fenerler -->
  <path class="rope" d="M800 40V150"/>
  <rect class="c-wood-dk o" x="776" y="150" width="48" height="14" rx="4"/>
  <rect class="lamp-glass o" x="780" y="164" width="40" height="54" rx="8"/>
  <rect class="c-wood-dk o" x="776" y="218" width="48" height="12" rx="4"/>
  <circle class="glow" cx="800" cy="192" r="140" fill="url(#glowG)"/>
  <rect class="c-wood-dk o" x="1706" y="770" width="52" height="14" rx="4"/>
  <rect class="lamp-glass o" x="1710" y="784" width="44" height="60" rx="8"/>
  <rect class="c-wood-dk o" x="1702" y="844" width="60" height="14" rx="4"/>
  <circle class="glow" cx="1732" cy="814" r="170" fill="url(#glowG)" style="animation-delay:-1.1s"/>
</svg>`;

export const FRONT_SVG = `
<svg viewBox="0 0 1920 1080" aria-hidden="true">
  <g id="vineL">
    <path class="vine-stem" d="M60-20C80 120 40 230 84 380C100 440 90 500 70 560"/>
    <ellipse class="c-leaf o" cx="92" cy="70" rx="34" ry="15" transform="rotate(28 92 70)"/>
    <ellipse class="c-leaf-dk o" cx="40" cy="150" rx="32" ry="14" transform="rotate(-30 40 150)"/>
    <ellipse class="c-leaf o" cx="96" cy="250" rx="36" ry="15" transform="rotate(24 96 250)"/>
    <ellipse class="c-leaf-dk o" cx="52" cy="340" rx="30" ry="13" transform="rotate(-26 52 340)"/>
    <ellipse class="c-leaf o" cx="104" cy="440" rx="30" ry="13" transform="rotate(30 104 440)"/>
    <ellipse class="c-leaf-dk o" cx="56" cy="530" rx="26" ry="12" transform="rotate(-20 56 530)"/>
    <path class="c-leaf-dk o" d="M-40 1120C40 980 130 930 220 950C150 1000 110 1060 100 1120Z"/>
    <path class="c-leaf o" d="M-40 1060C20 980 80 960 150 980C90 1010 50 1050 40 1100Z"/>
  </g>
  <use href="#vineL" transform="translate(1920 0) scale(-1 1)"/>
</svg>`;

/* kasetlerin alt-orta noktası (sahne px) — projeler bu sırayla yerleşir */
export const SLOTS = [
  { x: 1255, y: 470, s: 0.9, r: -3 },   // raf
  { x: 1460, y: 470, s: 0.9, r: 4 },    // raf
  { x: 410, y: 752, s: 0.95, r: -5 },   // kanepe
  { x: 640, y: 752, s: 0.95, r: 4 },    // kanepe
  { x: 520, y: 1000, s: 1.1, r: -4 },   // halı sol
  { x: 720, y: 1045, s: 1.15, r: 3 },   // halı ön
  { x: 1230, y: 1040, s: 1.15, r: -3 }, // halı sağ
  { x: 1350, y: 965, s: 1.05, r: 5 },   // zemin sağ
  { x: 330, y: 965, s: 1.05, r: -6 },   // zemin sol
  { x: 1200, y: 890, s: 1.0, r: 2 },    // BMO'nun yanı
];

export const OBJECTS = ["hat", "viola", "sword", "book", "gold"];
```

- [ ] **Step 5: Testin geçtiğini gör**

Run: `npx vitest run tests/unit/stage.test.js`
Expected: PASS (7 test)

- [ ] **Step 6: `src/scene/parallax.js` yaz**

```js
import { gsap } from "gsap";

/* L2 katmanı (derinlik 0.7) yatay ±12, dikey ±8 px kayar; diğerleri derinlikle orantılı */
export function initParallax(layerEls, state) {
  const movers = layerEls.map((el) => ({
    d: Number(el.dataset.depth),
    x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
    y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }),
  }));
  function set(mx, my) {
    movers.forEach((m) => { m.x((-mx * 24 * m.d) / 0.7); m.y((-my * 16 * m.d) / 0.7); });
  }
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || state.zoomed || state.narrow) return;
    set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
  });
  return { reset: () => set(0, 0) };
}
```

- [ ] **Step 7: Sahne SVG stillerini `src/styles/scene.css` sonuna ekle**

```css
/* --- SVG boyama --- */
.o { stroke: var(--ink); stroke-width: 6; stroke-linejoin: round; stroke-linecap: round; }
.c-sky { fill: var(--sky); } .c-sky2 { fill: var(--sky2); } .c-hill { fill: var(--hill); } .c-hill2 { fill: var(--hill2); } .c-sun { fill: var(--sun); }
.c-wall { fill: var(--wall); } .c-wall-dk { fill: var(--wall-dk); } .c-floor { fill: var(--floor); }
.c-wood { fill: var(--wood); } .c-wood-dk { fill: var(--wood-dk); }
.c-couch { fill: var(--couch); } .c-couch-dk { fill: var(--couch-dk); } .c-cush1 { fill: var(--cush1); } .c-cush2 { fill: var(--cush2); }
.c-rug { fill: var(--rug); } .c-gold { fill: var(--gold); } .c-pack { fill: var(--pack); } .c-pack-dk { fill: var(--pack-dk); } .c-hat { fill: var(--hat); }
.c-viola { fill: var(--viola); } .c-viola-dk { fill: var(--viola-dk); } .c-book { fill: var(--book); } .c-gem { fill: var(--gem); }
.c-leaf { fill: var(--leaf); } .c-leaf-dk { fill: var(--leaf-dk); } .c-pot { fill: var(--pot); }
.c-b1 { fill: var(--b1); } .c-b2 { fill: var(--b2); } .c-b3 { fill: var(--b3); } .c-b4 { fill: var(--b4); }
.c-ink { fill: var(--ink); } .c-paper { fill: var(--paper); }
[class^="c-"], [class*=" c-"] { transition: fill .6s; }
.bark { fill: none; stroke: var(--wall-dk); stroke-width: 12; stroke-linecap: round; transition: stroke .6s; }
.ring { fill: none; stroke: var(--wall-dk); stroke-width: 6; }
.win-frame-out { fill: none; stroke: var(--ink); stroke-width: 36; }
.win-frame { fill: none; stroke: var(--wood); stroke-width: 24; }
.win-bar-out { fill: none; stroke: var(--ink); stroke-width: 18; }
.win-bar { fill: none; stroke: var(--wood); stroke-width: 10; }
.rung-out { fill: none; stroke: var(--ink); stroke-width: 18; stroke-linecap: round; }
.rung { fill: none; stroke: var(--wood-dk); stroke-width: 10; stroke-linecap: round; }
.rope { fill: none; stroke: var(--wood-dk); stroke-width: 5; }
.plank-line { fill: none; stroke: var(--floor-dk); stroke-width: 5; stroke-linecap: round; transition: stroke .6s; }
.rug-in { fill: none; stroke: var(--rug-dk); stroke-width: 6; stroke-dasharray: 18 14; }
.blade-line, .coin-line { fill: none; stroke: var(--gold-dk); stroke-width: 5; stroke-linecap: round; }
.gold-line { fill: none; stroke: var(--gold); stroke-width: 5; stroke-linecap: round; }
.fhole { fill: none; stroke: var(--ink); stroke-width: 5; stroke-linecap: round; }
.strings { fill: none; stroke: var(--paper); stroke-width: 1.5; }
.vine-stem { fill: none; stroke: var(--leaf-dk); stroke-width: 8; stroke-linecap: round; }
.lamp-glass { fill: #ffe7a6; }
.stars { opacity: var(--stars); transition: opacity .6s; }
.moon-bite { fill: var(--sky); opacity: var(--moon); transition: opacity .6s, fill .6s; }
.glow { opacity: var(--lamp); mix-blend-mode: screen; transition: opacity .6s; animation: flicker 2.6s infinite; }
@keyframes flicker { 20% { opacity: calc(var(--lamp) * .75); } 23% { opacity: var(--lamp); } 55% { opacity: calc(var(--lamp) * .85); } }
.cloud { animation: drift 60s ease-in-out infinite alternate; }
@keyframes drift { to { transform: translateX(160px); } }

/* --- katman etkileşimi --- */
#l0, #l1, #l3 { pointer-events: none; }
.room-svg { pointer-events: none; }
.obj { pointer-events: auto; cursor: pointer; outline: none; transition: filter .2s; }
.obj:hover, .obj:focus-visible { filter: drop-shadow(0 0 10px rgba(255, 217, 138, .95)); }
.beam { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; filter: blur(10px); opacity: var(--beam-a); transition: opacity .6s;
  clip-path: polygon(240px 260px, 430px 380px, 1180px 1080px, 470px 1080px);
  background: linear-gradient(135deg, rgba(255, 236, 170, .9), rgba(255, 220, 140, .25) 60%, transparent 90%); }

@media (prefers-reduced-motion: reduce) {
  .cloud, .glow { animation: none; }
}
```

- [ ] **Step 8: Sahneyi `src/main.js`'te kur**

`src/main.js` (tamamı):
```js
import "./styles/tokens.css";
import "./styles/scene.css";
import "./styles/ui.css";
import "./styles/screen.css";
import "./styles/listview.css";
import { state } from "./state.js";
import { initStage } from "./scene/stage.js";
import { SKY_SVG, WALL_SVG, ROOM_SVG, FRONT_SVG } from "./scene/room.svg.js";
import { initParallax } from "./scene/parallax.js";
import { SLICES, sliceForHour, applySlice } from "./scene/daycycle.js";

const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* gün dilimi: ?t=night gibi parametre önceliklidir */
const forced = new URLSearchParams(location.search).get("t");
state.slice = SLICES.includes(forced) ? forced : sliceForHour(new Date().getHours());
applySlice(document.documentElement, state.slice);

/* katmanlar */
$("#l0").innerHTML = SKY_SVG;
$("#l1").innerHTML = WALL_SVG;
$("#l2").innerHTML = ROOM_SVG + `<div class="beam"></div>`;
$("#l3").innerHTML = FRONT_SVG;

const view = initStage($("#stage"), { onLayout: (v) => { state.narrow = v.narrow; } });
if (!reduced) initParallax([...document.querySelectorAll(".layer")], state);

export { view };
```

- [ ] **Step 9: Tarayıcıda bak**

Run: `npm run dev` (arka planda), sonra Playwright MCP ile `http://localhost:5173/?t=noon` ve `?t=night` aç.
Expected: Ağaç ev görünür; pencereden gökyüzü ve tepeler; gece sürümünde yıldızlar, ay ve yanan fenerler; fare hareketinde katmanlar farklı hızlarda kayar; konsolda hata yok.

- [ ] **Step 10: Commit**

```bash
git add src tests/unit/stage.test.js
git commit -m "Ağaç ev sahnesi: 4 parallax katmanı, Finn/Jake nesneleri, cover ölçekleme

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: BMO — SVG, yüz ifadeleri, davranışlar (+ STİL DURAĞI)

**Files:**
- Create: `src/bmo/bmo.svg.js`, `src/bmo/faces.js`, `src/bmo/behavior.js`
- Modify: `src/main.js`, `src/styles/scene.css`
- Test: `tests/unit/faces.test.js`

**Interfaces:**
- Consumes: `bus`, `state` (Görev 1), `line` (Görev 2)
- Produces:
  - `BMO_SVG` (string; ID'ler: `bmo-body`, `bmo-screen-rect`, `bmo-face`, `bmo-slot`, `bmo-slot-glow`, `bmo-lid`, `bmo-reels`, `bmo-reel-l`, `bmo-reel-r`, `bmo-arm-l`, `bmo-arm-r`, `bmo-leg-l`, `bmo-leg-r`)
  - `BMO_POS = { x: 816, y: 560, w: 300, h: 420 }` (sahne px)
  - `SCREEN_RECT = { x: 860, y: 596, w: 200, h: 146 }` (sahne px)
  - `FACES: Record<"idle"|"blink"|"hungry"|"talkA"|"talkB"|"happy"|"sad"|"giggle"|"loading", string>`
  - `createFace(el, faces?) → { setBase(name), flash(name, ms=600), talk(on: boolean), current: string }`
  - `initBehavior({ bmoEl, faceEl, face, bus, state, reduced }) → { dance() }`
  - `bus` olayları: dinler `face` (`{ base?, flash?, ms? }`) ve `reach` (`boolean` — kaset yaklaşınca kollar uzanır, yuva parlar)

- [ ] **Step 1: Başarısız testi yaz**

`tests/unit/faces.test.js`:
```js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFace } from "../../src/bmo/faces.js";

const FAKE = { idle: "I", blink: "B", hungry: "H", talkA: "TA", talkB: "TB", happy: "HP", sad: "S", giggle: "G", loading: "L" };

describe("createFace", () => {
  let el, face;
  beforeEach(() => { vi.useFakeTimers(); el = document.createElement("div"); face = createFace(el, FAKE); });
  afterEach(() => vi.useRealTimers());

  it("setBase yüzü çizer", () => { face.setBase("idle"); expect(el.innerHTML).toBe("I"); });
  it("flash süre dolunca temel yüze döner", () => {
    face.setBase("happy"); face.flash("blink", 130);
    expect(el.innerHTML).toBe("B");
    vi.advanceTimersByTime(131);
    expect(el.innerHTML).toBe("HP");
  });
  it("konuşurken ağız açılıp kapanır, susunca temel yüze döner", () => {
    face.setBase("idle"); face.talk(true);
    const a = el.innerHTML; vi.advanceTimersByTime(110); const b = el.innerHTML;
    expect(new Set([a, b])).toEqual(new Set(["TA", "TB"]));
    face.talk(false);
    expect(el.innerHTML).toBe("I");
  });
  it("flash konuşmanın önüne geçer", () => {
    face.talk(true); face.flash("giggle", 500);
    expect(face.current).toBe("giggle");
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/faces.test.js`
Expected: FAIL — modül bulunamıyor.

- [ ] **Step 3: `src/bmo/faces.js` yaz**

```js
/* Ekran yerel koordinatları: ekran dikdörtgeni x 44–244, y 36–182; merkez (144,109) */
const EYES = `<g class="eyes"><circle class="f" cx="108" cy="100" r="8"/><circle class="f" cx="180" cy="100" r="8"/></g>`;
const SMILE = `<path class="fs" d="M126 128q18 16 36 0"/>`;
const OPEN_SMILE = `<path class="f" d="M120 124h48q-4 26-24 26t-24-26Z"/>`;

export const FACES = {
  idle: EYES + SMILE,
  blink: `<path class="fs" d="M98 100h20M170 100h20"/>` + SMILE,
  hungry: `<g class="eyes"><circle class="f" cx="108" cy="98" r="12"/><circle class="f" cx="180" cy="98" r="12"/><circle class="shine" cx="112" cy="94" r="4"/><circle class="shine" cx="184" cy="94" r="4"/></g><ellipse class="f" cx="144" cy="138" rx="12" ry="14"/>`,
  talkA: EYES + `<path class="f" d="M126 126h36q-3 20-18 20t-18-20Z"/>`,
  talkB: EYES + `<path class="fs" d="M132 132h24"/>`,
  happy: `<path class="fs" d="M96 104l12-12 12 12M168 104l12-12 12 12"/>` + OPEN_SMILE,
  sad: EYES + `<path class="fs" d="M128 140q16-14 32 0"/>`,
  giggle: `<path class="fs" d="M96 96l14 9-14 9M192 96l-14 9 14 9"/>` + OPEN_SMILE + `<ellipse class="blush" cx="86" cy="130" rx="12" ry="7"/><ellipse class="blush" cx="202" cy="130" rx="12" ry="7"/>`,
  loading: `<text class="f mono" x="144" y="100" text-anchor="middle">LOADING</text><rect class="fs" x="84" y="116" width="120" height="16"/><rect id="bmo-load-bar" class="f" x="88" y="120" width="0" height="8"/>`,
};

export function createFace(el, faces = FACES) {
  let base = "idle", flashName = null, talking = false, mouthOpen = false;
  let flashT = 0, talkT = 0, shown = null;
  const current = () => flashName || (talking ? (mouthOpen ? "talkA" : "talkB") : base);
  const render = () => { const n = current(); if (n !== shown) { el.innerHTML = faces[n]; shown = n; } };
  return {
    setBase(name) { base = name; render(); },
    flash(name, ms = 600) {
      flashName = name; render();
      clearTimeout(flashT);
      flashT = setTimeout(() => { flashName = null; render(); }, ms);
    },
    talk(on) {
      talking = on; mouthOpen = on; clearInterval(talkT);
      if (on) talkT = setInterval(() => { mouthOpen = !mouthOpen; render(); }, 110);
      render();
    },
    get current() { return current(); },
  };
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run tests/unit/faces.test.js`
Expected: PASS (4 test)

- [ ] **Step 5: `src/bmo/bmo.svg.js` yaz**

```js
/* BMO — yerel viewBox 300×420; ön yüz x 18–270 (merkez 144). Sahnede BMO_POS'a yerleşir. */
export const BMO_POS = { x: 816, y: 560, w: 300, h: 420 };
export const SCREEN_RECT = { x: BMO_POS.x + 44, y: BMO_POS.y + 36, w: 200, h: 146 };

export const BMO_SVG = `
<svg viewBox="0 0 300 420" role="img" aria-label="BMO">
  <ellipse class="bmo-shadow" cx="148" cy="404" rx="118" ry="12"/>
  <g id="bmo-leg-l" class="limb"><path d="M108 330V392h-20"/></g>
  <g id="bmo-leg-r" class="limb"><path d="M180 330V392h20"/></g>
  <g id="bmo-arm-l" class="limb"><path d="M20 196C-4 212-6 248 4 270"/></g>
  <g id="bmo-arm-r" class="limb"><path d="M270 196C294 212 296 248 286 270"/></g>
  <g id="bmo-body">
    <rect class="bmo-side" x="28" y="18" width="252" height="324" rx="20"/>
    <rect class="bmo-front o" x="18" y="10" width="252" height="324" rx="20"/>
    <rect id="bmo-screen-rect" class="bmo-screen o" x="44" y="36" width="200" height="146" rx="14"/>
    <g id="bmo-face"></g>
    <g id="bmo-slot">
      <rect id="bmo-slot-glow" x="58" y="192" width="172" height="46" rx="12"/>
      <rect class="bmo-slot-hole o" x="66" y="200" width="156" height="30" rx="6"/>
      <g id="bmo-reels" opacity="0">
        <rect class="reel-win" x="104" y="206" width="80" height="18" rx="9"/>
        <g class="reel" id="bmo-reel-l"><circle cx="118" cy="215" r="7"/><path d="M118 208v14M111 215h14"/></g>
        <g class="reel" id="bmo-reel-r"><circle cx="170" cy="215" r="7"/><path d="M170 208v14M163 215h14"/></g>
      </g>
      <rect id="bmo-lid" class="bmo-lid o" x="66" y="200" width="156" height="30" rx="6"/>
    </g>
    <path class="bmo-dpad o" d="M74 254h22v-22h22v22h22v22h-22v22h-22v-22h-22Z"/>
    <path class="bmo-tri o" d="M182 286l16-28 16 28Z"/>
    <circle class="bmo-green o" cx="238" cy="252" r="9"/>
    <circle class="bmo-red o" cx="234" cy="296" r="18"/>
    <path class="bmo-slit" d="M88 316h26M88 326h26"/>
  </g>
</svg>`;
```

- [ ] **Step 6: `src/bmo/behavior.js` yaz**

```js
import { gsap } from "gsap";
import { line } from "../data/i18n.js";

export function initBehavior({ bmoEl, faceEl, face, bus, state, reduced }) {
  bus.on("face", ({ base, flash, ms } = {}) => {
    if (base) face.setBase(base);
    if (flash) face.flash(flash, ms);
  });

  /* kaset yaklaşınca: kollar uzanır, yuva parlar, aç yüz */
  bus.on("reach", (on) => {
    bmoEl.classList.toggle("hungry", on);
    face.setBase(on ? "hungry" : state.current ? "happy" : "idle");
    if (reduced) return;
    gsap.to("#bmo-arm-l", { rotation: on ? 28 : 0, transformOrigin: "100% 0%", duration: 0.3, ease: "back.out(2)" });
    gsap.to("#bmo-arm-r", { rotation: on ? -28 : 0, transformOrigin: "0% 0%", duration: 0.3, ease: "back.out(2)" });
  });

  /* göz kırpma */
  (function blinkLoop() {
    setTimeout(() => {
      if (face.current !== "loading" && !document.hidden) {
        face.flash("blink", 130);
        if (Math.random() < 0.25) setTimeout(() => face.flash("blink", 110), 260);
      }
      blinkLoop();
    }, 2500 + Math.random() * 3000);
  })();

  /* göz bebekleri fareyi izler (en fazla 4 px) */
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = faceEl.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1, m = Math.min(4, d / 60);
    faceEl.style.setProperty("--ex", ((dx / d) * m).toFixed(2) + "px");
    faceEl.style.setProperty("--ey", ((dy / d) * m).toFixed(2) + "px");
  });

  function dance() {
    if (reduced) return;
    bus.emit("face", { flash: "happy", ms: 1400 });
    gsap.timeline()
      .to(bmoEl, { rotation: -4, y: -8, transformOrigin: "50% 100%", duration: 0.18, ease: "sine.inOut", repeat: 5, yoyo: true })
      .to(bmoEl, { rotation: 0, y: 0, duration: 0.2 });
  }

  if (!reduced) {
    gsap.to("#bmo-body", { scaleY: 0.985, scaleX: 1.008, transformOrigin: "50% 100%", duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to("#bmo-leg-l", { rotation: 10, transformOrigin: "50% 0%", duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to("#bmo-leg-r", { rotation: -10, transformOrigin: "50% 0%", duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.45 });
  }

  /* boşta: 20–40 sn'de bir dans ya da mırıldanma */
  (function idleLoop() {
    setTimeout(() => {
      if (!state.busy && !state.current && !state.zoomed && !document.hidden) {
        if (Math.random() < 0.5) dance(); else bus.emit("say", line(state.lang, "idle"));
      }
      idleLoop();
    }, 20000 + Math.random() * 20000);
  })();

  return { dance };
}
```

- [ ] **Step 7: BMO stillerini `src/styles/scene.css` sonuna ekle**

```css
/* --- BMO --- */
.bmo { position: absolute; left: 816px; top: 560px; width: 300px; height: 420px; z-index: 2; cursor: pointer; }
.bmo > svg { width: 100%; height: 100%; overflow: visible; }
.bmo-front { fill: var(--bmo); } .bmo-side { fill: var(--bmo-dk); }
.bmo-screen { fill: var(--bmo-screen); }
.bmo-slot-hole { fill: var(--ink); } .bmo-lid { fill: var(--bmo-dk); }
.bmo-dpad { fill: var(--dpad); } .bmo-tri { fill: var(--tri); } .bmo-green { fill: var(--btn-g); } .bmo-red { fill: var(--btn-r); }
.bmo-slit { fill: none; stroke: var(--ink); stroke-width: 5; stroke-linecap: round; }
.bmo-shadow { fill: rgba(40, 16, 4, .35); }
.limb path { fill: none; stroke: var(--ink); stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; }
#bmo-slot-glow { fill: none; stroke: #ffd98a; stroke-width: 8; opacity: 0; transition: opacity .2s; filter: drop-shadow(0 0 8px #ffd98a); }
.bmo.hungry #bmo-slot-glow { opacity: 1; }
.reel-win { fill: #6b3f22; }
.reel circle { fill: #e9dcc0; stroke: var(--ink); stroke-width: 3; }
.reel path { stroke: var(--ink); stroke-width: 3; }
#bmo-face .f { fill: var(--bmo-face); }
#bmo-face .fs { fill: none; stroke: var(--bmo-face); stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; }
#bmo-face .shine { fill: var(--bmo-screen); }
#bmo-face .blush { fill: #f49ab0; opacity: .7; }
#bmo-face .mono { font-family: var(--f-term); font-size: 30px; }
#bmo-face .eyes { transform: translate(var(--ex, 0px), var(--ey, 0px)); transition: transform .12s; }
```

- [ ] **Step 8: BMO'yu `src/main.js`'e bağla**

`src/main.js` içinde `$("#l2").innerHTML = …` satırını şununla değiştir:
```js
$("#l2").innerHTML = `<div class="tapes" id="tapes"></div><div class="bmo" id="bmo">${BMO_SVG}</div>` + ROOM_SVG + `<div class="beam"></div>`;
```
(DOM sırası = Tab sırası: kasetler → nesneler. Görsel üst üste binme `z-index` ile: `.tapes` 3, `.bmo` 2.)

`import { state } from "./state.js";` satırını `import { bus, state } from "./state.js";` yap ve import bloğuna ekle:
```js
import { BMO_SVG } from "./bmo/bmo.svg.js";
import { createFace } from "./bmo/faces.js";
import { initBehavior } from "./bmo/behavior.js";
```
`initParallax(...)` satırından sonra ekle:
```js
const faceEl = $("#bmo-face");
const face = createFace(faceEl);
face.setBase("idle");
const bmo = initBehavior({ bmoEl: $("#bmo"), faceEl, face, bus, state, reduced });
```
Son satırı `export { view, face, bmo };` yap.

- [ ] **Step 9: Testleri çalıştır**

Run: `npx vitest run`
Expected: PASS (tüm birim testler)

- [ ] **Step 10: Commit**

```bash
git add src tests/unit/faces.test.js
git commit -m "BMO: parçalı SVG, yüz ifadeleri, göz kırpma/bakış/boşta davranışları

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11: STİL DURAĞI — kullanıcı onayı**

`npm run dev` açıkken Playwright MCP ile 1440×900'de dört dilimin ekran görüntüsünü al (`?t=morning`, `?t=noon`, `?t=sunset`, `?t=night`) ve 375×812'de bir tane (`?t=noon`). Görüntüleri kullanıcıya göster ve sor: "Stil, renkler, BMO'nun görünüşü ve nesnelerin yerleri uygun mu?"

**Kullanıcı onay vermeden Görev 6'ya geçme.** İstenen düzeltmeler (renk tokenları, koordinatlar, `SLOTS`, nesne yerleri) bu görevin dosyalarında yapılır, `npx vitest run` yeniden çalıştırılır ve ayrı commit atılır: `"Stil düzeltmeleri (kullanıcı geri bildirimi)"`.

---

### Task 6: Toz zerreleri ve ateş böcekleri

**Files:**
- Create: `src/scene/particles.js`
- Modify: `src/main.js`, `src/styles/scene.css`
- Test: `tests/unit/particles.test.js`

**Interfaces:**
- Consumes: `state.slice` (Görev 3), `bus` olayı `slice:change`
- Produces: `inBeam(x, y): boolean` (sahne px; Görev 4'teki `.beam` çokgeniyle aynı), `initParticles(canvas, state): void`

- [ ] **Step 1: Başarısız testi yaz**

`tests/unit/particles.test.js`:
```js
import { describe, it, expect } from "vitest";
import { inBeam } from "../../src/scene/particles.js";

describe("inBeam", () => {
  it("huzmenin içindeki noktalar", () => {
    expect(inBeam(400, 400)).toBe(true);
    expect(inBeam(800, 1000)).toBe(true);
  });
  it("huzmenin dışındaki noktalar", () => {
    expect(inBeam(200, 200)).toBe(false);   // huzmenin üstü
    expect(inBeam(300, 900)).toBe(false);   // sol kenarın solu
    expect(inBeam(1300, 900)).toBe(false);  // sağ kenarın sağı
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/particles.test.js`
Expected: FAIL — modül bulunamıyor.

- [ ] **Step 3: `src/scene/particles.js` yaz**

```js
/* Gündüz: pencere huzmesinde toz. Gece: odada dolaşan ateş böcekleri. Tek canvas, sahne ölçeğinde. */
const DPR = 2;

/* .beam çokgeni: (240,260) (430,380) (1180,1080) (470,1080) */
export function inBeam(x, y) {
  if (y < 260 || y > 1080) return false;
  const left = 240 + ((470 - 240) * (y - 260)) / 820;
  const right = y < 380 ? 240 + ((430 - 240) * (y - 260)) / 120 : 430 + ((1180 - 430) * (y - 380)) / 700;
  return x > left && x < right;
}

export function initParticles(canvas, state) {
  canvas.width = 1920 * DPR; canvas.height = 1080 * DPR;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const dust = Array.from({ length: 70 }, () => ({ x: rnd(260, 1100), y: rnd(280, 1060), r: rnd(0.8, 2.2), vx: rnd(-0.05, 0.12), vy: rnd(-0.06, 0.06), ph: rnd(0, 6) }));
  const flies = Array.from({ length: 24 }, () => ({ x: rnd(260, 1660), y: rnd(320, 1000), a: rnd(0, 6.28), sp: rnd(0.25, 0.6), ph: rnd(0, 6) }));

  function drawDust(t) {
    ctx.fillStyle = "#fff2c8";
    for (const p of dust) {
      p.x += p.vx + Math.sin(t / 2000 + p.ph) * 0.06;
      p.y += p.vy + Math.cos(t / 2500 + p.ph) * 0.05;
      if (p.y > 1070 || p.y < 270 || p.x > 1170 || p.x < 250) { p.y = rnd(300, 1040); p.x = rnd(300, 900); }
      if (!inBeam(p.x, p.y)) continue;
      ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(t / 900 + p.ph));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
  }
  function drawFlies(t) {
    for (const f of flies) {
      f.a += Math.sin(t / 1500 + f.ph) * 0.03;
      f.x += Math.cos(f.a) * f.sp; f.y += Math.sin(f.a) * f.sp * 0.6;
      if (f.x < 240 || f.x > 1680) f.a = Math.PI - f.a;
      if (f.y < 300 || f.y > 1020) f.a = -f.a;
      const glow = Math.max(0, Math.sin(t / 700 + f.ph));
      ctx.globalAlpha = 0.25 + 0.75 * glow;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 14);
      g.addColorStop(0, "rgba(230,255,140,1)"); g.addColorStop(1, "rgba(230,255,140,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 14, 0, 7); ctx.fill();
    }
  }
  (function tick(t) {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, 1920, 1080);
    if (state.slice === "night") drawFlies(t); else drawDust(t);
  })(0);
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run tests/unit/particles.test.js`
Expected: PASS (2 test)

- [ ] **Step 5: Canvas'ı bağla**

`src/styles/scene.css` sonuna:
```css
.particles { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; pointer-events: none; }
```

`src/main.js`'te `$("#l2").innerHTML = …` satırında `<div class="beam"></div>` parçasından hemen sonra `<canvas class="particles" id="particles"></canvas>` ekle. Import bloğuna `import { initParticles } from "./scene/particles.js";` ekle ve `initBehavior(...)` satırından sonra:
```js
if (!reduced) initParticles($("#particles"), state);
```

- [ ] **Step 6: Tarayıcıda bak**

`?t=noon`: pencere huzmesinde yavaşça süzülen toz. `?t=night`: odada yanıp sönen sarı-yeşil ateş böcekleri, huzme yok.

- [ ] **Step 7: Commit**

```bash
git add src tests/unit/particles.test.js
git commit -m "Toz zerreleri ve gece ateş böcekleri

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Konuşma balonu ve ses efektleri

**Files:**
- Create: `src/ui/speech.js`, `src/audio/sfx.js`
- Modify: `src/main.js`, `src/styles/ui.css`
- Test: `tests/unit/speech.test.js`, `tests/unit/sfx.test.js`

**Interfaces:**
- Consumes: `bus`, `state`, `store` (Görev 1), `face.talk` (Görev 5), `t` (Görev 2)
- Produces:
  - `createSpeech({ bubbleEl, textEl, liveEl, anchorEl, onBlip, onTalk, isNarrow }) → { say(text), stop(), place() }`
  - `hashId(id): number`, `tuneFor(id): number[8]`, `SCALE: number[]`
  - `createSfx(win = window) → { setEnabled(on), play(name), startLoop(id), stopLoop() }` — ses adları: `pick`, `drop`, `lid`, `clunk`, `eject`, `blip`, `giggle`, `coins`, `viola`
  - `bus` dinleyicileri (main): `say` → `speech.say`, `sfx` → `sfx.play`, `sound:change` → `sfx.setEnabled`

- [ ] **Step 1: Başarısız testleri yaz**

`tests/unit/speech.test.js`:
```js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSpeech } from "../../src/ui/speech.js";

describe("createSpeech", () => {
  let els, talk, blip, sp;
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="b"><p id="t"></p></div><p id="l"></p><div id="a"></div>`;
    els = { bubbleEl: document.getElementById("b"), textEl: document.getElementById("t"), liveEl: document.getElementById("l"), anchorEl: document.getElementById("a") };
    talk = vi.fn(); blip = vi.fn();
    sp = createSpeech({ ...els, onTalk: talk, onBlip: blip, isNarrow: () => false });
  });
  afterEach(() => vi.useRealTimers());

  it("metni harf harf yazar, erişilebilir bölgeye tamamını hemen koyar", () => {
    sp.say("Merhaba");
    expect(els.liveEl.textContent).toBe("Merhaba");
    vi.advanceTimersByTime(28 * 3);
    expect(els.textEl.textContent).toBe("Mer");
    vi.advanceTimersByTime(28 * 10);
    expect(els.textEl.textContent).toBe("Merhaba");
  });
  it("konuşma başında ve sonunda onTalk çağrılır", () => {
    sp.say("Hi");
    expect(talk).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(28 * 5);
    expect(talk).toHaveBeenLastCalledWith(false);
  });
  it("yeni replik eskisini keser", () => {
    sp.say("Uzun bir cümle"); vi.advanceTimersByTime(28 * 2);
    sp.say("Yeni"); vi.advanceTimersByTime(28 * 20);
    expect(els.textEl.textContent).toBe("Yeni");
  });
  it("her 3 harfte bir blip çalar", () => {
    sp.say("abcdef"); vi.advanceTimersByTime(28 * 6);
    expect(blip).toHaveBeenCalledTimes(2);
  });
});
```

`tests/unit/sfx.test.js`:
```js
import { describe, it, expect, vi } from "vitest";
import { tuneFor, SCALE, createSfx } from "../../src/audio/sfx.js";

describe("tuneFor", () => {
  it("aynı id için hep aynı 8 notayı verir, notalar gamdan", () => {
    const a = tuneFor("okey");
    expect(a).toHaveLength(8);
    expect(tuneFor("okey")).toEqual(a);
    a.forEach((f) => expect(SCALE).toContain(f));
  });
});

describe("createSfx", () => {
  it("ses kapalıyken AudioContext oluşturmaz", () => {
    const AC = vi.fn();
    const sfx = createSfx({ AudioContext: AC });
    sfx.play("pick"); sfx.startLoop("okey");
    expect(AC).not.toHaveBeenCalled();
  });
  it("AudioContext yoksa ses açıkken de hata vermez", () => {
    const sfx = createSfx({});
    sfx.setEnabled(true);
    expect(() => sfx.play("clunk")).not.toThrow();
  });
});
```

- [ ] **Step 2: Testlerin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/speech.test.js tests/unit/sfx.test.js`
Expected: FAIL — modüller bulunamıyor.

- [ ] **Step 3: `src/ui/speech.js` yaz**

```js
/* BMO'nun konuşma balonu: görünen metin harf harf; ekran okuyucuya tek seferde (liveEl) */
export function createSpeech({ bubbleEl, textEl, liveEl, anchorEl, onBlip, onTalk, isNarrow }) {
  let timer = 0;

  function place() {
    if (isNarrow()) { bubbleEl.style.left = ""; bubbleEl.style.top = ""; bubbleEl.classList.add("docked"); return; }
    bubbleEl.classList.remove("docked");
    const r = anchorEl.getBoundingClientRect();
    bubbleEl.style.left = Math.min(r.right - r.width * 0.08, innerWidth - bubbleEl.offsetWidth - 16) + "px";
    bubbleEl.style.top = Math.max(84, r.top - bubbleEl.offsetHeight + r.height * 0.1) + "px";
  }

  function stop() { clearInterval(timer); onTalk(false); }

  function say(text) {
    clearInterval(timer);
    liveEl.textContent = text;
    textEl.textContent = "";
    bubbleEl.hidden = false;
    place();
    let i = 0;
    onTalk(true);
    timer = setInterval(() => {
      textEl.textContent = text.slice(0, ++i);
      if (i % 3 === 0) onBlip();
      if (i >= text.length) { clearInterval(timer); onTalk(false); place(); }
    }, 28);
  }

  return { say, stop, place };
}
```

- [ ] **Step 4: `src/audio/sfx.js` yaz**

```js
/* WebAudio sentez sesleri — dosya yok. Varsayılan kapalı; AudioContext ilk açık kullanımda kurulur. */
export const SCALE = [262, 294, 330, 392, 440, 523, 587, 659];

export function hashId(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function tuneFor(id) {
  let h = hashId(id) || 1;
  return Array.from({ length: 8 }, () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return SCALE[(h >>> 8) % SCALE.length];
  });
}

export function createSfx(win = window) {
  let ctx = null, on = false, loopT = 0;

  function ensure() {
    if (!on) return null;
    try {
      const AC = win.AudioContext || win.webkitAudioContext;
      if (!AC) return null;
      ctx = ctx || new AC();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch { return null; }
  }

  function tone(f, d = 0.06, type = "square", vol = 0.03, slide) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d);
  }
  const later = (ms, fn) => setTimeout(fn, ms);

  const SOUNDS = {
    pick: () => tone(700, 0.07, "triangle", 0.05, 1100),
    drop: () => tone(500, 0.1, "triangle", 0.05, 250),
    lid: () => tone(320, 0.05, "square", 0.03, 180),
    clunk: () => { tone(150, 0.12, "triangle", 0.14, 80); later(90, () => tone(95, 0.16, "triangle", 0.12)); later(320, () => { tone(523, 0.09, "square", 0.025); later(90, () => tone(784, 0.12, "square", 0.025)); }); },
    eject: () => { tone(220, 0.08, "triangle", 0.12); later(70, () => tone(440, 0.1, "triangle", 0.06, 880)); },
    blip: () => tone(560 + Math.random() * 140, 0.025, "square", 0.018),
    giggle: () => [880, 988, 880, 1047].forEach((f, i) => later(i * 70, () => tone(f, 0.06, "square", 0.02))),
    coins: () => [1319, 1568, 1760, 2093].forEach((f, i) => later(i * 60, () => tone(f, 0.08, "triangle", 0.03))),
    viola: () => [392, 440, 494, 392].forEach((f, i) => later(i * 220, () => tone(f, 0.25, "sawtooth", 0.02))),
  };

  function stopLoop() { clearInterval(loopT); }

  return {
    setEnabled(v) { on = v; if (!v) stopLoop(); },
    play(name) { if (on) SOUNDS[name]?.(); },
    startLoop(id) {
      stopLoop(); if (!on) return;
      const notes = tuneFor(id); let i = 0;
      loopT = setInterval(() => {
        tone(notes[i % 8], 0.14, "square", 0.035);
        if (i % 2 === 0) tone(notes[0] / 2, 0.12, "triangle", 0.03);
        i++;
      }, 180);
    },
    stopLoop,
  };
}
```

- [ ] **Step 5: Testlerin geçtiğini gör**

Run: `npx vitest run tests/unit/speech.test.js tests/unit/sfx.test.js`
Expected: PASS (7 test)

- [ ] **Step 6: Balon stillerini `src/styles/ui.css`'e yaz**

```css
/* --- konuşma balonu --- */
.speech { position: fixed; z-index: 12; max-width: min(340px, calc(100vw - 32px)); padding: 12px 16px 10px; background: var(--paper); color: var(--ink);
  border: 3px solid var(--ink); border-radius: 22px 22px 22px 6px; box-shadow: 0 5px 0 rgba(30, 10, 2, .35); pointer-events: none; }
.speech::before { content: ""; position: absolute; left: -14px; bottom: 8px; width: 18px; height: 18px; background: var(--paper);
  border-left: 3px solid var(--ink); border-bottom: 3px solid var(--ink); transform: skewY(-35deg); }
.speech p { margin: 0; font-family: var(--f-hand); font-size: 22px; line-height: 1.15; min-height: 1.15em; }
.speech small { display: block; margin-top: 6px; font-size: 12px; font-weight: 700; color: #7a5a40; }
.speech.docked { left: 16px; right: 16px; top: calc(76px + env(safe-area-inset-top, 0px)); max-width: none; border-radius: 18px; }
.speech.docked::before, .speech.docked small { display: none; }
```

- [ ] **Step 7: `src/main.js`'e bağla**

Import bloğuna ekle:
```js
import { store } from "./state.js";
import { createSpeech } from "./ui/speech.js";
import { createSfx } from "./audio/sfx.js";
import { t, pickLang, applyI18n } from "./data/i18n.js";
```
(`./state.js` importlarını tek satırda birleştir: `import { bus, state, store } from "./state.js";`)

`initParticles` satırından sonra ekle:
```js
/* dil + ses tercihleri */
state.lang = pickLang(store.get("lang"), navigator.language);
document.documentElement.lang = state.lang;
applyI18n(document, state.lang);
state.sound = store.get("sound") === "on";

const sfx = createSfx();
sfx.setEnabled(state.sound);
const speech = createSpeech({
  bubbleEl: $("#speech"), textEl: $("#speechText"), liveEl: $("#live"), anchorEl: $("#bmo"),
  onBlip: () => sfx.play("blip"), onTalk: (on) => face.talk(on), isNarrow: () => state.narrow,
});
bus.on("say", (text) => speech.say(text));
bus.on("sfx", (name) => sfx.play(name));
bus.on("sound:change", (on) => sfx.setEnabled(on));
addEventListener("resize", () => speech.place());

bus.emit("say", t(state.lang, "welcome"));
```
`index.html`'deki `<div class="speech" id="speech" …>` öğesine `hidden` ekle (ilk replikle görünür olur).

- [ ] **Step 8: Tarayıcıda bak**

Sayfa açılınca BMO'nun sağ üstünde balon belirir, karşılama metni harf harf yazılırken BMO'nun ağzı oynar; 375 px genişlikte balon üst çubuğun altına yerleşir.

- [ ] **Step 9: Commit**

```bash
git add src index.html tests/unit/speech.test.js tests/unit/sfx.test.js
git commit -m "Konuşma balonu ve sentez ses efektleri

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Kasetler — yerleşim, raf ve sürükleme

**Files:**
- Create: `src/tapes/tape.js`
- Modify: `src/main.js`, `src/styles/scene.css`, `src/styles/ui.css`
- Test: `tests/unit/tape.test.js`

**Interfaces:**
- Consumes: `PROJECTS`, `assignSlots` (Görev 2), `SLOTS` (Görev 4), `loc`, `t`, `fmt` (Görev 2), `view.k` (Görev 4)
- Produces:
  - `tapeHTML(project, lang): string` (kaset iç HTML'i)
  - `createTapes(projects, lang): Record<id, HTMLButtonElement>` (her butonda `dataset.id`)
  - `placeTapes({ tapes, placed, sceneHost, trayHost, narrow, currentId }): void`
  - `makeGhost(tapeEl): HTMLElement` — `position: fixed` klon; `ghost._home = { x, y, fs }` (ekran px, kasetin sol-üst köşesi ve font-size)
  - `bindDrag(tapeEl, project, { isBusy, overBmo, onReach, onInsert, onMiss })` — `onInsert(project, ghost|null)`, `onMiss(project, ghost)`, `onReach(boolean)`
  - `relabelTapes(tapes, projects, lang): void` (dil değişince etiket ve aria-label)

- [ ] **Step 1: Başarısız testi yaz**

`tests/unit/tape.test.js`:
```js
import { describe, it, expect, beforeEach } from "vitest";
import { createTapes, placeTapes, relabelTapes } from "../../src/tapes/tape.js";

const P = [
  { id: "a", color: { shell: "#111", label: "#222" }, title: { tr: "Bir", en: "One" } },
  { id: "b", color: { shell: "#333", label: "#444" }, title: { tr: "İki", en: "Two" } },
];
const SL = [{ x: 400, y: 500, s: 1, r: 2 }, { x: 600, y: 700, s: 0.9, r: -3 }];

describe("tapes", () => {
  let tapes, scene, tray;
  beforeEach(() => {
    document.body.innerHTML = `<div id="scene"></div><div id="tray"></div>`;
    scene = document.getElementById("scene"); tray = document.getElementById("tray");
    tapes = createTapes(P, "tr");
  });

  it("her proje için etiketli, erişilebilir buton üretir", () => {
    expect(tapes.a.tagName).toBe("BUTTON");
    expect(tapes.a.textContent).toContain("Bir");
    expect(tapes.a.getAttribute("aria-label")).toBe("Bir kasetini oynat");
  });

  it("geniş düzende yuva koordinatlarıyla sahneye yerleşir", () => {
    placeTapes({ tapes, placed: P.map((project, i) => ({ project, slot: SL[i] })), sceneHost: scene, trayHost: tray, narrow: false, currentId: null });
    expect(tapes.b.parentElement).toBe(scene);
    expect(tapes.b.style.left).toBe("600px");
    expect(tapes.b.style.getPropertyValue("--sc")).toBe("0.9");
  });

  it("dar düzende rafa geçer; takılı kaset gizli kalır", () => {
    const placed = P.map((project, i) => ({ project, slot: SL[i] }));
    tapes.a.classList.add("gone");
    placeTapes({ tapes, placed, sceneHost: scene, trayHost: tray, narrow: true, currentId: "a" });
    expect(tapes.a.parentElement).toBe(tray);
    expect(tapes.a.classList.contains("gone")).toBe(true);
    placeTapes({ tapes, placed, sceneHost: scene, trayHost: tray, narrow: false, currentId: "a" });
    expect(tapes.a.parentElement).toBe(scene);
    expect(tapes.a.classList.contains("gone")).toBe(true);
    expect(tapes.b.classList.contains("gone")).toBe(false);
  });

  it("dil değişince etiket ve aria-label güncellenir", () => {
    relabelTapes(tapes, P, "en");
    expect(tapes.a.textContent).toContain("One");
    expect(tapes.a.getAttribute("aria-label")).toBe("Play the One tape");
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/tape.test.js`
Expected: FAIL — modül bulunamıyor.

- [ ] **Step 3: `src/tapes/tape.js` yaz**

```js
import { gsap } from "gsap";
import { loc, t, fmt } from "../data/i18n.js";

export function tapeHTML(p, lang) {
  return `<span class="cas"><span class="lab"><em>A</em><b>${loc(lang, p.title)}</b></span><span class="win"><i></i><i></i></span><span class="scr a"></span><span class="scr b"></span></span><span class="easel"><span class="contact"></span></span>`;
}

export function createTapes(projects, lang) {
  const tapes = {};
  projects.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tape"; b.dataset.id = p.id;
    b.style.setProperty("--shell", p.color.shell);
    b.style.setProperty("--lab", p.color.label);
    b.innerHTML = tapeHTML(p, lang);
    b.setAttribute("aria-label", fmt(t(lang, "tape_aria"), { t: loc(lang, p.title) }));
    tapes[p.id] = b;
  });
  return tapes;
}

export function relabelTapes(tapes, projects, lang) {
  projects.forEach((p) => {
    const b = tapes[p.id]; if (!b) return;
    b.querySelector(".lab b").textContent = loc(lang, p.title);
    b.setAttribute("aria-label", fmt(t(lang, "tape_aria"), { t: loc(lang, p.title) }));
  });
}

export function placeTapes({ tapes, placed, sceneHost, trayHost, narrow, currentId }) {
  placed.forEach(({ project, slot }) => {
    const el = tapes[project.id];
    if (narrow) {
      el.style.left = el.style.top = "";
      trayHost.appendChild(el);
    } else {
      el.style.left = slot.x + "px"; el.style.top = slot.y + "px";
      el.style.setProperty("--sc", String(slot.s));
      el.style.setProperty("--r", slot.r + "deg");
      sceneHost.appendChild(el);
    }
    el.classList.toggle("gone", project.id === currentId);
  });
}

/* sürüklenen/uçan kopya: ekran px'inde, sahne ölçeğinden bağımsız */
export function makeGhost(tapeEl) {
  const wasGone = tapeEl.classList.contains("gone");
  tapeEl.classList.remove("gone");
  const r = tapeEl.querySelector(".cas").getBoundingClientRect();
  if (wasGone) tapeEl.classList.add("gone");
  const g = tapeEl.cloneNode(true);
  g.className = "tape ghost"; g.removeAttribute("aria-label"); g.setAttribute("aria-hidden", "true");
  g._home = { x: r.left, y: r.top, fs: r.width / 7 };
  g.style.fontSize = g._home.fs + "px";
  document.body.appendChild(g);
  gsap.set(g, { x: r.left, y: r.top, rotation: 0 });
  return g;
}

export function bindDrag(el, p, { isBusy, overBmo, onReach, onInsert, onMiss }) {
  let sx = 0, sy = 0, lastX = 0, dragging = false, ghost = null, ox = 0, oy = 0, near = false;
  let toX, toY, toR;

  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || isBusy()) return;
    sx = lastX = e.clientX; sy = e.clientY; dragging = false;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging) {
      /* raftaki yatay kaydırmayı engelleme */
      if (el.closest(".tray") && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) { el.releasePointerCapture(e.pointerId); return; }
      if (Math.hypot(dx, dy) < 7) return;
      dragging = true;
      ghost = makeGhost(el);
      ox = sx - ghost._home.x; oy = sy - ghost._home.y;
      el.classList.add("gone");
      gsap.to(ghost, { scale: 1.08, duration: 0.15 });
      toX = gsap.quickTo(ghost, "x", { duration: 0.12, ease: "power3" });
      toY = gsap.quickTo(ghost, "y", { duration: 0.12, ease: "power3" });
      toR = gsap.quickTo(ghost, "rotation", { duration: 0.35, ease: "back.out(3)" });
      el.dispatchEvent(new CustomEvent("tape:pick", { bubbles: true }));
    }
    toX(e.clientX - ox); toY(e.clientY - oy);
    toR(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.8)));
    lastX = e.clientX;
    const isNear = overBmo(e.clientX, e.clientY);
    if (isNear !== near) { near = isNear; onReach(near); }
  });

  const end = (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    el.releasePointerCapture(e.pointerId);
    if (near) { near = false; onReach(false); }
    if (!dragging) { if (e.type === "pointerup") onInsert(p, null); return; }
    const g = ghost; ghost = null; dragging = false;
    if (overBmo(e.clientX, e.clientY)) onInsert(p, g); else onMiss(p, g);
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  /* klavye (Enter/Space) tıklaması: detail === 0 */
  el.addEventListener("click", (e) => { if (e.detail === 0 && !isBusy()) onInsert(p, null); });
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run tests/unit/tape.test.js`
Expected: PASS (4 test)

- [ ] **Step 5: Kaset stillerini `src/styles/scene.css` sonuna ekle**

```css
/* --- kasetler --- */
.tapes { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
.tape { position: absolute; font-size: 18px; padding: 0; border: 0; background: none; color: inherit; cursor: grab; touch-action: none; pointer-events: auto;
  transform: translate(-50%, -100%) scale(var(--sc, 1)) rotate(var(--r, 0deg)); transform-origin: 50% 100%; transition: transform .2s, filter .2s; }
.tape:hover { transform: translate(-50%, -100%) scale(calc(var(--sc, 1) * 1.08)) rotate(0deg) translateY(-3px); filter: drop-shadow(0 0 6px rgba(255, 217, 138, .9)); }
.tape:focus-visible { outline: 3px dashed #ffd98a; outline-offset: 4px; border-radius: 6px; }
.tape.gone { visibility: hidden; }
.cas { position: relative; display: block; box-sizing: border-box; width: 7em; height: 4.5em; border: .22em solid var(--ink); border-radius: .5em; background: var(--shell, #4a3a36);
  box-shadow: inset .25em .25em 0 rgba(255, 255, 255, .14), inset -.25em -.3em 0 rgba(0, 0, 0, .25), 0 .2em 0 rgba(30, 10, 2, .35); }
.lab { position: absolute; left: .4em; right: .4em; top: .38em; height: 2.35em; border: .14em solid var(--ink); border-radius: .25em; overflow: hidden;
  background: repeating-linear-gradient(180deg, transparent 0 .52em, rgba(120, 90, 60, .22) .52em .6em), var(--paper); }
.lab::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: .55em; background: var(--lab); border-bottom: .12em solid var(--ink); }
.lab b { position: absolute; left: .3em; right: .3em; top: .62em; font-family: var(--f-hand); font-weight: 400; font-size: 1.12em; line-height: 1.1; color: #3a2418; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lab em { position: absolute; right: .25em; top: -.05em; font-style: normal; font-family: var(--f-hand); font-size: .62em; color: var(--ink); opacity: .8; }
.win { position: absolute; left: 1.6em; right: 1.6em; bottom: .42em; height: 1.2em; border-radius: .6em; background: #2a1810; display: flex; align-items: center; justify-content: space-between; padding: 0 .18em; }
.win::before { content: ""; position: absolute; left: 1em; right: 1em; top: .35em; bottom: .35em; background: #6b3f22; border-radius: .2em; }
.win i { position: relative; width: .85em; height: .85em; border-radius: 50%; background: conic-gradient(#e9dcc0 0 20%, #2a1810 0 25%, #e9dcc0 0 45%, #2a1810 0 50%, #e9dcc0 0 70%, #2a1810 0 75%, #e9dcc0 0 95%, #2a1810 0); }
.tape:hover .win i, .ghost .win i { animation: spin 1.4s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.scr { position: absolute; bottom: .3em; width: .38em; height: .38em; border-radius: 50%; background: radial-gradient(circle, rgba(0, 0, 0, .5) 0 30%, rgba(255, 255, 255, .25) 31%); }
.scr.a { left: .4em; } .scr.b { right: .4em; }
.easel { position: relative; display: block; width: 5.4em; height: 1.3em; margin: -.25em auto 0; }
.easel::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: .5em; background: linear-gradient(var(--wood), var(--wood-dk)); border: .15em solid var(--ink); border-radius: .2em; z-index: 1; }
.easel::after { content: ""; position: absolute; left: .5em; right: .5em; top: .3em; bottom: 0;
  background: linear-gradient(100deg, transparent 40%, var(--ink) 40% 46%, var(--wood-dk) 46% 54%, var(--ink) 54% 60%, transparent 60%) left/26% 100% no-repeat,
              linear-gradient(80deg, transparent 40%, var(--ink) 40% 46%, var(--wood-dk) 46% 54%, var(--ink) 54% 60%, transparent 60%) right/26% 100% no-repeat; }
.contact { position: absolute; left: -10%; right: -10%; bottom: -.35em; height: .8em; border-radius: 50%; background: radial-gradient(closest-side, rgba(30, 10, 2, .5), transparent); z-index: -1; }
.ghost { position: fixed; left: 0; top: 0; z-index: 60; pointer-events: none; transform-origin: 50% 50%; filter: drop-shadow(0 12px 8px rgba(20, 6, 0, .45)); }
.ghost .easel { display: none; }
```

`src/styles/ui.css` sonuna (kaset rafı):
```css
/* --- dar düzen kaset rafı --- */
.tray { display: none; }
@media (max-width: 700px), (orientation: portrait) {
  .tray { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 9; gap: 14px; overflow-x: auto; scrollbar-width: none; scroll-snap-type: x mandatory;
    padding: 14px max(16px, env(safe-area-inset-right, 0px)) calc(14px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
    background: linear-gradient(180deg, var(--wood) 0 10px, var(--wood-dk) 10px); border-top: 4px solid var(--ink); box-shadow: 0 -6px 0 rgba(30, 10, 2, .3); }
  .tray::-webkit-scrollbar { display: none; }
  .tray .tape { position: relative; flex: 0 0 auto; font-size: 13px; transform: none; touch-action: pan-x; scroll-snap-align: start; }
  .tray .tape:hover { transform: translateY(-2px); }
  .tray .easel { display: none; }
  .speech small { display: none; }
}
```

- [ ] **Step 6: `src/main.js`'e bağla (geçici: takma = konsola yaz; Görev 9 gerçek koreografiyi bağlar)**

Import bloğuna ekle:
```js
import { PROJECTS, assignSlots } from "./data/projects.js";
import { SLOTS } from "./scene/room.svg.js";
import { createTapes, placeTapes, bindDrag } from "./tapes/tape.js";
```
(`./scene/room.svg.js` importunu birleştir.)

`bus.emit("say", t(state.lang, "welcome"));` satırından **önce** ekle:
```js
/* kasetler */
const { placed } = assignSlots(PROJECTS, SLOTS);
const tapes = createTapes(placed.map((e) => e.project), state.lang);
function layoutTapes() {
  placeTapes({ tapes, placed, sceneHost: $("#tapes"), trayHost: $("#tray"), narrow: state.narrow, currentId: state.current?.id ?? null });
}
layoutTapes();
matchMedia("(max-width: 700px), (orientation: portrait)").addEventListener("change", layoutTapes);

function overBmo(x, y) {
  const r = $("#bmo-slot").getBoundingClientRect();
  return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < 220 * view.k;
}
const handlers = {
  isBusy: () => state.busy,
  overBmo,
  onReach: (on) => bus.emit("reach", on),
  onInsert: (p, ghost) => play(p, ghost),
  onMiss: (p, ghost) => miss(p, ghost),
};
placed.forEach(({ project }) => bindDrag(tapes[project.id], project, handlers));
document.addEventListener("tape:pick", () => bus.emit("sfx", "pick"));

/* Görev 9'da değiştirilecek geçici akış */
function play(p, ghost) { ghost?.remove(); tapes[p.id].classList.remove("gone"); console.info("play", p.id); }
function miss(p, ghost) { ghost?.remove(); tapes[p.id].classList.remove("gone"); }
```

- [ ] **Step 7: Tarayıcıda bak**

Geniş ekranda 7 kaset raf/kanepe/halı yuvalarında; sürüklerken kaset eğilip salınır; BMO'ya yaklaşınca yuva parlar, kollar uzanır, yüz "aç" olur. 375 px'te kasetler alttaki ahşap rafta, yatay kaydırılabilir.

- [ ] **Step 8: Commit**

```bash
git add src tests/unit/tape.test.js
git commit -m "Kasetler: yuvalara yerleşim, dar düzen rafı, yay fizikli sürükleme

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Takma / çıkarma koreografisi

**Files:**
- Create: `src/tapes/choreo.js`
- Modify: `src/main.js`, `src/styles/scene.css`

**Interfaces:**
- Consumes: `makeGhost` (Görev 8), `bus`, `state` (Görev 1), `loc`, `t` (Görev 2)
- Produces (hepsi `Promise<void>` döner; `state.busy` yönetmez — onu `main.js` yönetir):
  - `insertTape(p, ghost|null, ctx)` — kapak açılır, kaset yuvaya kayar, kapak kapanır, BMO esner, makaralar döner, notalar başlar; bittiğinde `state.current = p` ve `bus.emit("tape:loaded", p)`
  - `ejectTape(p, ctx, { quick = false } = {})` — kaset yuvadan fırlayıp evine seker; `state.current = null`; `bus.emit("tape:ejected", p)`
  - `missTape(p, ghost, ctx)` — kaset düşüp evine seker; BMO `sad`
  - `ctx = { tapes, bus, state, reduced, stageEl }` (`stageEl` = `#l2`, notaların ekleneceği yer)
- `main.js` akış fonksiyonları: `play(p, ghost)`, `eject()`, `miss(p, ghost)` — Görev 10'da `screen.open/close` eklenecek

- [ ] **Step 1: `src/tapes/choreo.js` yaz**

```js
import { gsap } from "gsap";
import { makeGhost } from "./tape.js";
import { loc, t } from "../data/i18n.js";

const reels = ["#bmo-reel-l", "#bmo-reel-r"];
let reelTween = null, noteTimer = 0;

function slotBox() {
  return document.querySelector("#bmo-slot .bmo-slot-hole").getBoundingClientRect();
}

function startNotes(host) {
  clearInterval(noteTimer);
  noteTimer = setInterval(() => {
    if (document.hidden) return;
    const n = document.createElement("span");
    const left = Math.random() < 0.5;
    n.className = "note"; n.textContent = Math.random() < 0.5 ? "♪" : "♫";
    n.style.left = (left ? 830 : 1080) + "px"; n.style.top = "590px";
    host.appendChild(n);
    gsap.fromTo(n, { opacity: 0, x: 0, y: 0, rotation: 0 },
      { opacity: 1, duration: 0.3, onComplete: () => gsap.to(n, { x: (left ? -1 : 1) * (20 + Math.random() * 30), y: -90, rotation: (left ? -1 : 1) * 20, opacity: 0, duration: 1.9, ease: "power1.out", onComplete: () => n.remove() }) });
  }, 700);
}
function stopNotes() { clearInterval(noteTimer); }

export async function insertTape(p, ghost, { tapes, bus, state, reduced, stageEl }) {
  const el = tapes[p.id];
  el.classList.add("gone");
  const g = ghost || makeGhost(el);
  bus.emit("reach", true);

  if (reduced) {
    g.remove();
  } else {
    const s = slotBox();
    const fs = (s.width * 0.92) / 7;               // yuva genişliğine sığan kaset
    const tx = s.left + s.width * 0.04, ty = s.top - fs * 4.5 * 0.55;
    const tl = gsap.timeline();
    bus.emit("sfx", "lid");
    tl.to("#bmo-lid", { scaleY: 0.15, transformOrigin: "50% 0%", duration: 0.18, ease: "power2.out" }, 0);
    if (!ghost) tl.to(g, { y: "-=90", scale: 1.1, duration: 0.25, ease: "power2.out" }, 0);
    tl.to(g, { x: tx, y: ty, fontSize: fs, scale: 1, rotation: 0, duration: ghost ? 0.32 : 0.45, ease: "power2.inOut" }, ghost ? 0 : 0.25)
      .to(g, { y: ty + fs * 4.5, clipPath: "inset(0% 0% 100% 0%)", duration: 0.25, ease: "power2.in" })
      .add(() => { g.remove(); bus.emit("sfx", "clunk"); })
      .to("#bmo-lid", { scaleY: 1, duration: 0.18, ease: "back.out(3)" })
      .to("#bmo", { scaleY: 0.92, scaleX: 1.06, transformOrigin: "50% 100%", duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, "<");
    await tl;
  }

  gsap.set("#bmo-reels", { opacity: 1 });
  if (!reduced) reelTween = gsap.to(reels, { rotation: 360, transformOrigin: "50% 50%", duration: 1.1, ease: "none", repeat: -1 });
  state.current = p;
  bus.emit("reach", false);
  bus.emit("face", { base: "happy" });
  bus.emit("say", loc(state.lang, p.line));
  if (!reduced) startNotes(stageEl);
  bus.emit("tape:loaded", p);
}

export async function ejectTape(p, { tapes, bus, state, reduced }, { quick = false } = {}) {
  const el = tapes[p.id];
  stopNotes();
  reelTween?.kill(); reelTween = null;
  gsap.set("#bmo-reels", { opacity: 0 });
  bus.emit("sfx", "eject");
  state.current = null;
  bus.emit("face", { base: "idle" });

  if (!reduced) {
    const g = makeGhost(el);
    const home = g._home, s = slotBox(), fs = (s.width * 0.92) / 7;
    gsap.set(g, { x: s.left + s.width * 0.04, y: s.top, fontSize: fs, opacity: 0 });
    const tl = gsap.timeline();
    tl.to("#bmo-lid", { scaleY: 0.15, transformOrigin: "50% 0%", duration: 0.12 })
      .to(g, { opacity: 1, y: s.top - fs * 6, duration: quick ? 0.18 : 0.25, ease: "power2.out" })
      .to("#bmo-lid", { scaleY: 1, duration: 0.15, ease: "back.out(3)" }, "<")
      .to(g, { x: home.x, fontSize: home.fs, duration: quick ? 0.3 : 0.45, ease: "power1.inOut" })
      .to(g, { y: home.y, duration: quick ? 0.3 : 0.45, ease: "bounce.out" }, "<");
    await tl;
    g.remove();
  }
  el.classList.remove("gone");
  gsap.fromTo(el, { filter: "brightness(1.6)" }, { filter: "brightness(1)", duration: 0.5, clearProps: "filter" });
  bus.emit("tape:ejected", p);
}

export async function missTape(p, ghost, { tapes, bus, state, reduced }) {
  const el = tapes[p.id];
  bus.emit("sfx", "drop");
  if (!reduced && ghost) {
    const h = ghost._home;
    await gsap.timeline()
      .to(ghost, { x: h.x, rotation: 0, scale: 1, duration: 0.45, ease: "power1.out" })
      .to(ghost, { y: h.y, duration: 0.45, ease: "bounce.out" }, "<");
  }
  ghost?.remove();
  if (state.current?.id !== p.id) el.classList.remove("gone");
  bus.emit("face", { flash: "sad", ms: 900 });
  bus.emit("say", t(state.lang, "miss"));
}
```

- [ ] **Step 2: Nota stilini `src/styles/scene.css` sonuna ekle**

```css
.note { position: absolute; z-index: 4; font-family: var(--f-hand); font-size: 34px; color: var(--paper); -webkit-text-stroke: 1.6px var(--ink); pointer-events: none; }
```

- [ ] **Step 3: `src/main.js`'teki geçici akışı gerçek akışla değiştir**

Import bloğuna ekle:
```js
import { insertTape, ejectTape, missTape } from "./tapes/choreo.js";
```
Görev 8'deki `/* Görev 9'da değiştirilecek geçici akış */` bloğunu (iki fonksiyon) **sil** ve yerine yaz:
```js
/* --- akış: busy kilidi yalnızca burada --- */
const choreo = { tapes, bus, state, reduced, stageEl: $("#l2") };

async function play(p, ghost) {
  if (state.busy) { ghost?.remove(); return; }
  if (state.current?.id === p.id) { ghost?.remove(); tapes[p.id].classList.add("gone"); return; }
  state.busy = true;
  try {
    if (state.current) await ejectTape(state.current, choreo, { quick: true });
    await insertTape(p, ghost, choreo);
  } finally { state.busy = false; }
}

async function eject() {
  if (state.busy || !state.current) return;
  state.busy = true;
  try {
    const p = state.current;
    await ejectTape(p, choreo);
    bus.emit("say", t(state.lang, "ejected"));
    tapes[p.id].focus({ preventScroll: true });
  } finally { state.busy = false; }
}

function miss(p, ghost) { missTape(p, ghost, choreo); }

bus.on("tape:loaded", (p) => sfx.startLoop(p.id));
bus.on("tape:ejected", () => sfx.stopLoop());
```

`handlers` nesnesi zaten `play` ve `miss`'i çağırıyor — değişiklik gerekmez (fonksiyon bildirimleri hoist edilir; `choreo` sabiti `handlers`'tan sonra tanımlandığı için `play` yalnızca kullanıcı etkileşiminde çalışır, sorun yok).

Geçici çıkarma kısayolu (Görev 10 BMO ekranındaki ⏏ düğmesiyle değişecek): dosyanın sonuna
```js
addEventListener("keydown", (e) => { if (e.key === "Escape") eject(); });
```

- [ ] **Step 4: Testleri çalıştır**

Run: `npx vitest run`
Expected: PASS (tüm birim testler — bu görev yeni birim testi eklemez; koreografi Görev 10/14'teki e2e testleriyle doğrulanır)

- [ ] **Step 5: Tarayıcıda elle doğrula**

1. Kasete tıkla → kaset havalanır, BMO'nun kapağı açılır, kaset yuvaya kayıp kaybolur, kapak kapanır, BMO esner, makaralar döner, notalar uçar, balonda projenin repliği.
2. Başka kasete tıkla → ilki fırlayıp evine seker, yenisi takılır.
3. Esc → kaset çıkar, "Kaset çıktı…" repliği.
4. Kaseti BMO'dan uzağa bırak → seker, BMO üzgün, "Aww…".
5. Animasyon sürerken başka kasete art arda tıkla → yok sayılır, takılma yok.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "Kaset takma/çıkarma/ıskalama koreografisi

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Kamera zoom ve BMO ekranında proje görünümü

**Files:**
- Create: `src/ui/html.js`, `src/ui/screen.js`, `playwright.config.js`
- Modify: `src/main.js`, `src/styles/screen.css`
- Test: `tests/unit/screen.test.js`, `tests/e2e/screen.spec.js`

**Interfaces:**
- Consumes: `SCREEN_RECT` (Görev 5), `W`, `H`, `view` (Görev 4), `usableLinks` (Görev 2), `t`, `loc` (Görev 2), `parallax.reset()` (Görev 4)
- Produces:
  - `esc(str): string` (HTML kaçışı)
  - `cameraFor(rect, vw, vh, k, fill, oy): { x, y, scale }` — `.camera`'ya uygulanınca `rect` ekranın ortasına gelir ve kısa kenarın `fill` oranını kaplar
  - `renderScreen(p, lang, index, total): string`
  - `createScreen({ cameraEl, uiEl, backdropEl, view, state, bus, reduced, parallax, projects }) → { open(p): Promise, close(): Promise, relayout(), rerender() }`
  - `bus.emit("screen:closed")` — kullanıcı ⏏, Esc veya ekran dışına tıklayarak kapatmak istedi (main bunu `eject()`'e bağlar)

- [ ] **Step 1: Başarısız birim testini yaz**

`tests/unit/screen.test.js`:
```js
import { describe, it, expect } from "vitest";
import { cameraFor, renderScreen } from "../../src/ui/screen.js";
import { esc } from "../../src/ui/html.js";

const RECT = { x: 860, y: 596, w: 200, h: 146 };

describe("cameraFor", () => {
  it.each([[1440, 900, 0], [375, 812, -200]])("ekran merkezini görüntünün ortasına getirir (%i×%i)", (vw, vh, oy) => {
    const k = Math.max(vw / 1920, vh / 1080) * 1.04;
    const c = cameraFor(RECT, vw, vh, k, 0.8, oy);
    const cx = RECT.x + RECT.w / 2, cy = RECT.y + RECT.h / 2;
    /* sahne → ekran: v = merkez + oy + k * (kamera(p) - sahneMerkezi) */
    expect(vw / 2 + k * (c.x + c.scale * cx - 960)).toBeCloseTo(vw / 2);
    expect(vh / 2 + oy + k * (c.y + c.scale * cy - 540)).toBeCloseTo(vh / 2);
  });
  it("ekran hiçbir kenarda fill oranını aşmaz", () => {
    const k = 1.04, c = cameraFor(RECT, 1440, 900, k, 0.8, 0);
    expect(RECT.w * k * c.scale).toBeLessThanOrEqual(0.8 * 1440 + 0.001);
    expect(RECT.h * k * c.scale).toBeLessThanOrEqual(0.8 * 900 + 0.001);
  });
});

describe("renderScreen", () => {
  const base = { id: "x", status: "live", title: { tr: "Başlık" }, kind: { tr: "Tür" }, desc: { tr: "Açıklama" }, stack: ["A"], shots: [], links: [] };
  it("başlık, sıra ve durumu yazar", () => {
    const html = renderScreen(base, "tr", 2, 7);
    expect(html).toContain("03/07");
    expect(html).toContain("Başlık");
    expect(html).toContain("Yayında");
  });
  it("ekran görüntüsü ve kullanılabilir link yoksa o bölümler çıkmaz", () => {
    const html = renderScreen({ ...base, links: [{ label: "Boş", url: "" }, { label: "Kare", url: "#" }] }, "tr", 0, 1);
    expect(html).not.toContain("s-shots");
    expect(html).not.toContain("<a ");
    expect(html).toContain('data-act="eject"');
  });
  it("metni HTML'e kaçışlar", () => {
    expect(renderScreen({ ...base, desc: { tr: "<b>x</b>" } }, "tr", 0, 1)).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(esc(`"'&`)).toBe("&quot;&#39;&amp;");
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/screen.test.js`
Expected: FAIL — modüller bulunamıyor.

- [ ] **Step 3: `src/ui/html.js` yaz**

```js
const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => MAP[c]);
```

- [ ] **Step 4: `src/ui/screen.js` yaz**

```js
import { gsap } from "gsap";
import { SCREEN_RECT } from "../bmo/bmo.svg.js";
import { W, H } from "../scene/stage.js";
import { t, loc } from "../data/i18n.js";
import { usableLinks } from "../data/projects.js";
import { esc } from "./html.js";

/* .camera dönüşümü translate(x,y) scale(s), origin 0 0. Ekran merkezi (cx,cy) görüntü merkezine gelsin. */
export function cameraFor(rect, vw, vh, k, fill, oy) {
  const scale = Math.min((fill * vw) / (rect.w * k), (fill * vh) / (rect.h * k));
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  return { scale, x: W / 2 - scale * cx, y: H / 2 - oy / k - scale * cy };
}

const pad = (n) => String(n).padStart(2, "0");

export function renderScreen(p, lang, index, total) {
  const links = usableLinks(p);
  const shots = p.shots || [];
  const title = loc(lang, p.title);
  return `
  <div class="crt">
    <div class="s-row"><span>${esc(t(lang, "side"))} · ${pad(index + 1)}/${pad(total)}</span><span class="chip${p.status === "live" ? " live" : ""}">${esc(t(lang, "status_" + p.status))}</span></div>
    <h2 id="sTitle" tabindex="-1">${esc(title)}</h2>
    <div class="s-kind">&gt; ${esc(loc(lang, p.kind))}</div>
    ${shots.length ? `<div class="s-shots" role="group" tabindex="0" aria-label="${esc(t(lang, "shots"))}">${shots.map((s, i) => `<img src="${esc(s)}" alt="${esc(title)} ${i + 1}" loading="lazy" decoding="async" onerror="this.remove()">`).join("")}</div>` : ""}
    <p class="s-desc">${esc(loc(lang, p.desc))}</p>
    <ul class="s-stack">${(p.stack || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <div class="s-actions">${links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}<button type="button" class="s-eject" data-act="eject">${esc(t(lang, "eject"))}</button></div>
  </div>`;
}

export function createScreen({ cameraEl, uiEl, backdropEl, view, state, bus, reduced, parallax, projects }) {
  let shown = null;
  const target = () => cameraFor(SCREEN_RECT, innerWidth, innerHeight, view.k, view.narrow ? 0.94 : 0.8, view.oy);

  function placeUi() {
    if (reduced) return;
    const r = document.getElementById("bmo-screen-rect").getBoundingClientRect();
    const inset = Math.min(r.width, r.height) * 0.035;
    Object.assign(uiEl.style, { left: r.left + inset + "px", top: r.top + inset + "px", width: r.width - 2 * inset + "px", height: r.height - 2 * inset + "px" });
  }
  function fill(p) { uiEl.innerHTML = renderScreen(p, state.lang, projects.indexOf(p), projects.length); }

  async function open(p) {
    shown = p; fill(p);
    state.zoomed = true;
    parallax?.reset();
    backdropEl.hidden = false;
    if (reduced) uiEl.classList.add("panel");
    else {
      document.body.classList.add("zoomed");
      await gsap.to(cameraEl, { ...target(), duration: 0.7, ease: "power2.inOut" });
      placeUi();
    }
    uiEl.hidden = false;
    uiEl.classList.remove("on"); void uiEl.offsetWidth; uiEl.classList.add("on");
    uiEl.querySelector("#sTitle").focus({ preventScroll: true });
  }

  async function close() {
    if (!state.zoomed) return;
    uiEl.hidden = true; backdropEl.hidden = true; shown = null;
    document.body.classList.remove("zoomed");
    if (!reduced) await gsap.to(cameraEl, { x: 0, y: 0, scale: 1, duration: 0.6, ease: "power2.inOut" });
    state.zoomed = false;
  }

  function relayout() {
    if (!state.zoomed || reduced) return;
    gsap.set(cameraEl, target());
    placeUi();
  }

  function rerender() {
    if (!shown || uiEl.hidden) return;
    fill(shown);
    uiEl.querySelector("#sTitle").focus({ preventScroll: true });
  }

  uiEl.addEventListener("click", (e) => { if (e.target.closest("[data-act=eject]")) bus.emit("screen:closed"); });
  backdropEl.addEventListener("click", () => bus.emit("screen:closed"));
  addEventListener("keydown", (e) => {
    if (uiEl.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); bus.emit("screen:closed"); return; }
    if (e.key !== "Tab") return;
    const f = [...uiEl.querySelectorAll("a, button, [tabindex='0']")];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!uiEl.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  return { open, close, relayout, rerender };
}
```

- [ ] **Step 5: Birim testinin geçtiğini gör**

Run: `npx vitest run tests/unit/screen.test.js`
Expected: PASS (6 test)

- [ ] **Step 6: Ekran stillerini `src/styles/screen.css`'e yaz**

```css
.screen-backdrop { position: fixed; inset: 0; z-index: 15; }
.screen-ui { position: fixed; z-index: 20; box-sizing: border-box; overflow: auto; overscroll-behavior: contain; border-radius: 14px;
  padding: clamp(12px, 2.4vmin, 32px); color: var(--bmo-face); font-family: var(--f-term); container-type: size; -webkit-user-select: text; user-select: text;
  background: repeating-linear-gradient(0deg, rgba(0, 40, 20, .06) 0 2px, transparent 2px 4px), radial-gradient(ellipse at center, #dcfad8, var(--bmo-screen) 78%); }
.screen-ui.on { animation: crt .55s ease-out; }
@keyframes crt { 0% { clip-path: inset(49% 0 49% 0); filter: brightness(2.2); } 50% { clip-path: inset(0); filter: brightness(1.4); } 100% { clip-path: inset(0); filter: none; } }
.s-row { display: flex; justify-content: space-between; gap: 10px; font-size: clamp(16px, 2.6cqw, 22px); }
.screen-ui .chip { border: 2px solid currentColor; border-radius: 6px; padding: 0 8px; }
.screen-ui .chip.live { background: var(--bmo-face); color: var(--bmo-screen); }
.screen-ui h2 { margin: .25em 0 0; font-weight: 400; font-size: clamp(34px, 8cqw, 72px); line-height: .95; outline: none; text-wrap: balance; }
.s-kind { font-size: clamp(18px, 3cqw, 26px); }
.s-shots { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; margin: 12px 0; padding-bottom: 4px; }
.s-shots img { flex: 0 0 auto; height: clamp(120px, 32cqh, 280px); border-radius: 8px; border: 3px solid var(--bmo-face); scroll-snap-align: start; }
.s-desc { font-family: var(--f-body); font-weight: 500; font-size: clamp(15px, 2.2cqw, 18px); line-height: 1.55; margin: 12px 0; max-width: 62ch; }
.s-stack { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 14px; padding: 0; list-style: none; }
.s-stack li { font-size: clamp(16px, 2.4cqw, 20px); padding: 0 8px; border: 2px solid var(--bmo-face); border-radius: 6px; }
.s-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.s-actions a, .s-eject { display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px; border-radius: 8px; font: inherit; font-size: clamp(18px, 2.6cqw, 24px); text-decoration: none; cursor: pointer; }
.s-actions a { background: var(--bmo-face); color: var(--bmo-screen); border: 0; }
.s-eject { margin-left: auto; background: #c0362e; color: #fff; border: 3px solid var(--ink); box-shadow: 0 3px 0 rgba(30, 10, 2, .4); }
.s-actions a:focus-visible, .s-eject:focus-visible, .s-shots:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
.screen-ui.panel { left: 50%; top: 50%; width: min(560px, 92vw); max-height: 84vh; height: auto; container-type: inline-size; transform: translate(-50%, -50%); border: 5px solid var(--ink); }
#l0, #l1, #l3, .room-svg, .tapes { transition: filter .5s; }
body.zoomed #l0, body.zoomed #l1, body.zoomed #l3, body.zoomed .room-svg, body.zoomed .tapes { filter: blur(4px) brightness(.7); }
body.zoomed .speech { display: none; }
```

- [ ] **Step 7: `src/main.js`'i ekrana bağla**

1. `if (!reduced) initParallax(...)` satırını şuna çevir:
```js
const parallax = reduced ? null : initParallax([...document.querySelectorAll(".layer")], state);
```
2. Import bloğuna ekle: `import { createScreen } from "./ui/screen.js";`
3. `const choreo = …` satırından **önce** ekle:
```js
const screen = createScreen({ cameraEl: $("#camera"), uiEl: $("#screenUi"), backdropEl: $("#screenBackdrop"), view, state, bus, reduced, parallax, projects: PROJECTS });
addEventListener("resize", () => screen.relayout());
```
4. `play` ve `eject` fonksiyonlarını şunlarla değiştir:
```js
async function play(p, ghost) {
  if (state.busy) {
    ghost?.remove();
    if (state.current?.id !== p.id) tapes[p.id].classList.remove("gone");
    return;
  }
  state.busy = true;
  try {
    if (state.current?.id === p.id) { ghost?.remove(); tapes[p.id].classList.add("gone"); await screen.open(p); return; }
    if (state.current) { await screen.close(); await ejectTape(state.current, choreo, { quick: true }); }
    await insertTape(p, ghost, choreo);
    await screen.open(p);
  } finally { state.busy = false; }
}

async function eject() {
  if (state.busy || !state.current) return;
  state.busy = true;
  try {
    const p = state.current;
    await screen.close();
    await ejectTape(p, choreo);
    bus.emit("say", t(state.lang, "ejected"));
    tapes[p.id].focus({ preventScroll: true });
  } finally { state.busy = false; }
}
bus.on("screen:closed", eject);
```
5. Görev 9'daki geçici `addEventListener("keydown", … Escape … eject())` satırını **sil** (Esc artık `screen.js`'te).

- [ ] **Step 8: Playwright'ı kur ve yapılandır**

Run: `npx playwright install chromium`
Expected: Chromium indirilir.

`playwright.config.js`:
```js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30000,
  use: { baseURL: "http://localhost:4173", locale: "tr-TR", timezoneId: "Europe/Istanbul" },
  webServer: { command: "npm run build && npm run preview", url: "http://localhost:4173", reuseExistingServer: true, timeout: 120000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 9: E2E testlerini yaz (Review Focus 1 ve 2)**

`tests/e2e/screen.spec.js`:
```js
import { test, expect } from "@playwright/test";

const ready = async (page) => {
  await page.goto("/?t=noon");
  await expect(page.locator('.tape[data-id="okey"]')).toBeVisible();
  await expect(page.locator("#loader")).toBeHidden({ timeout: 5000 }).catch(() => {}); // Görev 11'den önce loader yok
};

test("kasete tıklayınca proje BMO ekranında açılır, Esc ile kaset yerine döner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tape = page.locator('.tape[data-id="okey"]');
  await tape.click();
  await expect(page.locator("#screenUi")).toBeVisible();
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
  await expect(page.locator("#sTitle")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(tape).toBeVisible();
  await expect(tape).toBeFocused();
});

test("animasyon sürerken ikinci kasete tıklama yok sayılır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await page.locator('.tape[data-id="tbh"]').click();
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
  await expect(page.locator('.tape[data-id="tbh"]')).toBeVisible();
});

test("proje açıkken pencere boyutu değişince ekran görünür alanda kalır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toBeVisible();
  for (const [w, h] of [[1000, 1200], [1920, 1080], [800, 600]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    const b = await page.locator("#screenUi").boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(w + 1);
    expect(b.y + b.height).toBeLessThanOrEqual(h + 1);
  }
});
```

- [ ] **Step 10: E2E testlerini çalıştır**

Run: `npx playwright test tests/e2e/screen.spec.js`
Expected: PASS (3 test). Başarısız olursa `npx playwright show-report` ile izi incele; kamera hesabı hatalıysa `cameraFor` birim testine o durumu ekleyip düzelt.

- [ ] **Step 11: Commit**

```bash
git add src playwright.config.js tests
git commit -m "Kamera zoom ve BMO ekranında proje görünümü (odak tuzağı, Esc, yeniden hizalama)

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Üst çubuk, hızlı görünüm (Liste), yükleme ekranı ve son `main.js`

**Files:**
- Create: `src/ui/topbar.js`, `src/ui/listview.js`, `src/ui/loader.js`
- Modify: `src/bmo/behavior.js` (el sallama), `src/main.js` (tamamı yeniden yazılır), `src/styles/ui.css`, `src/styles/listview.css`
- Test: `tests/unit/topbar.test.js`, `tests/unit/listview.test.js`, `tests/unit/loader.test.js`

**Interfaces:**
- Consumes: `applySlice`, `nextSlice` (Görev 3), `PROFILE`, `usableLinks`, `t`, `loc` (Görev 2), `esc` (Görev 10), `relabelTapes` (Görev 8), `screen.rerender` (Görev 10)
- Produces:
  - `initTopbar({ state, bus, store, onList }) → { paint() }` — yayar: `lang:change`, `slice:change`, `sound:change`
  - `renderList(projects, profile, lang): string`, `initListview({ el, state, bus, projects, profile }) → { open(), close() }` (`#liste` adresiyle açılır)
  - `runLoader({ el, barEl, timeout = 2500, ready = document.fonts?.ready }): Promise<void>`
  - `initBehavior(...)` dönüşüne `wave()` eklenir

- [ ] **Step 1: Başarısız testleri yaz**

`tests/unit/topbar.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initTopbar } from "../../src/ui/topbar.js";
import { createBus } from "../../src/state.js";

describe("initTopbar", () => {
  let state, bus, store, onList;
  beforeEach(() => {
    document.body.innerHTML = `<button id="btnList"></button><button id="btnLang"></button><button id="btnTime"></button><button id="btnSound"></button>`;
    state = { lang: "tr", slice: "noon", sound: false };
    bus = createBus(); store = { set: vi.fn(), get: vi.fn() }; onList = vi.fn();
    initTopbar({ state, bus, store, onList });
  });

  it("dil düğmesi TR↔EN değiştirir, kaydeder ve olay yayar", () => {
    const fn = vi.fn(); bus.on("lang:change", fn);
    document.getElementById("btnLang").click();
    expect(state.lang).toBe("en");
    expect(store.set).toHaveBeenCalledWith("lang", "en");
    expect(fn).toHaveBeenCalledWith("en");
    expect(document.getElementById("btnLang").textContent).toBe("EN");
  });
  it("saat düğmesi sıradaki dilime geçer ve sınıfı uygular", () => {
    document.getElementById("btnTime").click();
    expect(state.slice).toBe("sunset");
    expect(document.documentElement.classList.contains("t-sunset")).toBe(true);
  });
  it("ses düğmesi açar, kaydeder, aria-pressed günceller", () => {
    const fn = vi.fn(); bus.on("sound:change", fn);
    document.getElementById("btnSound").click();
    expect(fn).toHaveBeenCalledWith(true);
    expect(store.set).toHaveBeenCalledWith("sound", "on");
    expect(document.getElementById("btnSound").getAttribute("aria-pressed")).toBe("true");
  });
  it("liste düğmesi onList çağırır", () => {
    document.getElementById("btnList").click();
    expect(onList).toHaveBeenCalled();
  });
});
```

`tests/unit/listview.test.js`:
```js
import { describe, it, expect } from "vitest";
import { renderList } from "../../src/ui/listview.js";
import { PROJECTS } from "../../src/data/projects.js";

const EMPTY = { name: "Erdem", email: "", github: "", linkedin: "", cv: { tr: "", en: "" } };

describe("renderList", () => {
  it("Hakkımda metnini tanıtım olarak, diğer 6 projeyi kart olarak gösterir", () => {
    document.body.innerHTML = renderList(PROJECTS, EMPTY, "tr");
    expect(document.querySelector(".lv-about").textContent).toContain("Mersin Üniversitesi");
    expect(document.querySelectorAll(".lv-card")).toHaveLength(6);
  });
  it("CV ve iletişim bilgisi yoksa o bölümler çıkmaz", () => {
    const html = renderList(PROJECTS, EMPTY, "tr");
    expect(html).not.toContain("lv-cv");
    expect(html).not.toContain("lv-contacts");
  });
  it("dile göre CV ve iletişim linkleri çıkar", () => {
    const html = renderList(PROJECTS, { ...EMPTY, email: "a@b.c", cv: { tr: "/cv-tr.pdf", en: "/cv-en.pdf" } }, "en");
    expect(html).toContain('href="/cv-en.pdf"');
    expect(html).toContain('href="mailto:a@b.c"');
  });
  it("boş linkler kartlarda görünmez, fan-art notu altbilgide", () => {
    const html = renderList(PROJECTS, EMPTY, "tr");
    expect(html).not.toContain('href=""');
    expect(html).toContain("Cartoon Network");
  });
});
```

`tests/unit/loader.test.js`:
```js
import { describe, it, expect, vi, afterEach } from "vitest";
import { runLoader } from "../../src/ui/loader.js";

describe("runLoader", () => {
  afterEach(() => vi.useRealTimers());
  it("hazır sinyali hiç gelmezse süre dolunca yine kapanır", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="l"><b id="b"></b></div>`;
    const el = document.getElementById("l");
    const p = runLoader({ el, barEl: document.getElementById("b"), timeout: 2500, ready: new Promise(() => {}) });
    await vi.advanceTimersByTimeAsync(2500 + 500);
    await p;
    expect(el.hidden).toBe(true);
  });
  it("hazır sinyali gelince beklemeden kapanır", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="l"><b id="b"></b></div>`;
    const el = document.getElementById("l");
    const p = runLoader({ el, barEl: document.getElementById("b"), timeout: 2500, ready: Promise.resolve() });
    await vi.advanceTimersByTimeAsync(500);
    await p;
    expect(el.hidden).toBe(true);
  });
});
```

- [ ] **Step 2: Testlerin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/topbar.test.js tests/unit/listview.test.js tests/unit/loader.test.js`
Expected: FAIL — modüller bulunamıyor.

- [ ] **Step 3: `src/ui/topbar.js` yaz**

```js
import { applySlice, nextSlice } from "../scene/daycycle.js";

const ICON = { morning: "🌅", noon: "☀", sunset: "🌇", night: "🌙" };

export function initTopbar({ state, bus, store, onList }) {
  const $ = (id) => document.getElementById(id);
  const btnLang = $("btnLang"), btnTime = $("btnTime"), btnSound = $("btnSound"), btnList = $("btnList");

  function paint() {
    btnLang.textContent = state.lang.toUpperCase();
    btnTime.textContent = ICON[state.slice];
    btnSound.textContent = state.sound ? "🔊" : "🔇";
    btnSound.setAttribute("aria-pressed", String(state.sound));
  }

  btnLang.addEventListener("click", () => {
    state.lang = state.lang === "tr" ? "en" : "tr";
    store.set("lang", state.lang);
    bus.emit("lang:change", state.lang);
    paint();
  });
  btnTime.addEventListener("click", () => {
    state.slice = nextSlice(state.slice);
    applySlice(document.documentElement, state.slice);
    bus.emit("slice:change", state.slice);
    paint();
  });
  btnSound.addEventListener("click", () => {
    state.sound = !state.sound;
    store.set("sound", state.sound ? "on" : "off");
    bus.emit("sound:change", state.sound);
    paint();
  });
  btnList.addEventListener("click", () => onList());

  paint();
  return { paint };
}
```

- [ ] **Step 4: `src/ui/listview.js` yaz**

```js
import { t, loc } from "../data/i18n.js";
import { usableLinks } from "../data/projects.js";
import { esc } from "./html.js";

const linkA = (l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`;

function card(p, lang) {
  const links = usableLinks(p), shot = p.shots?.[0];
  return `<article class="lv-card" style="--lab:${esc(p.color.label)}">
    ${shot ? `<img src="${esc(shot)}" alt="${esc(loc(lang, p.title))}" loading="lazy" decoding="async" onerror="this.remove()">` : ""}
    <div class="lv-card-top"><h4>${esc(loc(lang, p.title))}</h4><span class="chip${p.status === "live" ? " live" : ""}">${esc(t(lang, "status_" + p.status))}</span></div>
    <div class="lv-kind">${esc(loc(lang, p.kind))}</div>
    <p>${esc(loc(lang, p.desc))}</p>
    <ul class="lv-stack">${(p.stack || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    ${links.length ? `<p class="lv-links">${links.map(linkA).join("")}</p>` : ""}
  </article>`;
}

export function renderList(projects, profile, lang) {
  const about = projects.find((p) => p.id === "hakkimda");
  const rest = projects.filter((p) => p.id !== "hakkimda");
  const cv = profile.cv?.[lang];
  const contacts = [
    profile.email && `<a href="mailto:${esc(profile.email)}">✉ ${esc(profile.email)}</a>`,
    profile.github && linkA({ url: profile.github, label: "GitHub" }),
    profile.linkedin && linkA({ url: profile.linkedin, label: "LinkedIn" }),
  ].filter(Boolean);
  return `<div class="lv-inner">
    <header class="lv-head"><h2 id="lvTitle" tabindex="-1">${esc(t(lang, "list_title"))}</h2><button type="button" class="lv-close" data-act="close">${esc(t(lang, "list_back"))}</button></header>
    ${about ? `<p class="lv-about">${esc(loc(lang, about.desc))}</p>` : ""}
    ${cv ? `<p><a class="lv-cv" href="${esc(cv)}" download>${esc(t(lang, "cv"))}</a></p>` : ""}
    ${contacts.length ? `<section><h3>${esc(t(lang, "contact"))}</h3><p class="lv-contacts">${contacts.join("")}</p></section>` : ""}
    <section><h3>${esc(t(lang, "projects"))}</h3><div class="lv-grid">${rest.map((p) => card(p, lang)).join("")}</div></section>
    <footer class="lv-foot">${esc(t(lang, "footer_note"))}</footer>
  </div>`;
}

export function initListview({ el, state, bus, projects, profile }) {
  let openedInApp = false, lastFocus = null;
  const render = () => { el.innerHTML = renderList(projects, profile, state.lang); };

  function sync() {
    const open = location.hash === "#liste";
    if (open === !el.hidden) return;
    el.hidden = !open;
    document.body.classList.toggle("list-open", open);
    if (open) { lastFocus = document.activeElement; el.scrollTop = 0; el.querySelector("#lvTitle").focus(); }
    else lastFocus?.focus?.({ preventScroll: true });
  }
  function open() { openedInApp = true; location.hash = "liste"; }
  function close() {
    if (openedInApp) { openedInApp = false; history.back(); }
    else { history.replaceState(null, "", location.pathname + location.search); sync(); }
  }

  el.addEventListener("click", (e) => { if (e.target.closest("[data-act=close]")) close(); });
  /* capture: BMO ekranının Esc dinleyicisinden önce yakalar */
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.hidden) { e.stopPropagation(); close(); } }, true);
  addEventListener("hashchange", sync);
  bus.on("lang:change", render);
  render();
  sync();
  return { open, close };
}
```

- [ ] **Step 5: `src/ui/loader.js` yaz**

```js
/* Fontlar hazır olunca (en geç timeout ms) yükleme ekranını kapatır */
export async function runLoader({ el, barEl, timeout = 2500, ready = document.fonts?.ready }) {
  barEl.style.transition = `width ${timeout}ms cubic-bezier(.2,.7,.3,1)`;
  barEl.style.width = "10%";
  void barEl.offsetWidth;
  barEl.style.width = "92%";
  await Promise.race([Promise.resolve(ready).catch(() => {}), new Promise((r) => setTimeout(r, timeout))]);
  barEl.style.transition = "width .2s"; barEl.style.width = "100%";
  el.classList.add("out");
  await new Promise((r) => setTimeout(r, 450));
  el.hidden = true;
}
```

- [ ] **Step 6: Testlerin geçtiğini gör**

Run: `npx vitest run tests/unit/topbar.test.js tests/unit/listview.test.js tests/unit/loader.test.js`
Expected: PASS (10 test)

- [ ] **Step 7: `src/bmo/behavior.js`'e el sallamayı ekle**

`function dance() { … }` bloğundan sonra ekle:
```js
  function wave() {
    if (reduced) return;
    gsap.timeline()
      .to("#bmo-arm-r", { rotation: -110, transformOrigin: "0% 0%", duration: 0.25, ease: "power2.out" })
      .to("#bmo-arm-r", { rotation: -80, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" })
      .to("#bmo-arm-r", { rotation: 0, duration: 0.3, ease: "back.out(2)" });
  }
```
ve `return { dance };` satırını `return { dance, wave };` yap.

- [ ] **Step 8: Stilleri yaz**

`src/styles/ui.css` sonuna:
```css
/* --- üst çubuk --- */
.topbar { position: fixed; left: 0; right: 0; top: 0; z-index: 25; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
  padding: calc(10px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px)); pointer-events: none; }
.topbar > * { pointer-events: auto; }
.sign { transform-origin: 50% 0; animation: sway 6s ease-in-out infinite; }
@keyframes sway { 50% { transform: rotate(1.6deg); } }
.plank { position: relative; background: linear-gradient(180deg, #c98c55, var(--wood) 60%, var(--wood-dk)); border: 3px solid var(--ink); border-radius: 10px; padding: 8px 18px 9px; box-shadow: 0 5px 0 rgba(30, 10, 2, .5); }
.plank::before, .plank::after { content: ""; position: absolute; top: 8px; width: 7px; height: 7px; border-radius: 50%; background: #4a2a16; }
.plank::before { left: 7px; } .plank::after { right: 7px; }
.plank h1 { margin: 0; font-family: var(--f-hand); font-weight: 400; font-size: 30px; line-height: 1; color: var(--paper); text-shadow: 0 2px 0 var(--ink); }
.plank p { margin: 3px 0 0; font-size: 11.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #3a2010; }
.tools { display: flex; gap: 8px; }
.tool { min-width: 44px; min-height: 44px; padding: 0 12px; font-family: var(--f-term); font-size: 20px; color: var(--ink); background: var(--paper); border: 3px solid var(--ink); border-radius: 10px; box-shadow: 0 4px 0 rgba(30, 10, 2, .45); cursor: pointer; }
.tool:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(30, 10, 2, .45); }
.tool:focus-visible { outline: 3px solid #ffd98a; outline-offset: 2px; }

/* --- altbilgi --- */
.fanart { position: fixed; right: 12px; bottom: 8px; z-index: 8; margin: 0; font-size: 11px; font-weight: 700; color: var(--paper); opacity: .85; text-shadow: 0 1px 0 var(--ink); pointer-events: none; }
body.zoomed .fanart { display: none; }

/* --- yükleme ekranı --- */
.loader { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; background: var(--bmo); transition: opacity .45s; }
.loader.out { opacity: 0; }
.loader-screen { width: min(320px, 70vw); aspect-ratio: 200 / 146; box-sizing: border-box; border: 6px solid var(--ink); border-radius: 18px; background: var(--bmo-screen);
  display: grid; place-content: center; justify-items: center; gap: 12px; font-family: var(--f-term); font-size: 32px; color: var(--bmo-face); }
.loader-screen i { display: block; width: 160px; height: 18px; border: 4px solid var(--bmo-face); padding: 2px; box-sizing: content-box; }
.loader-screen b { display: block; height: 100%; width: 0; background: var(--bmo-face); }

.noscript { position: fixed; inset: 0; z-index: 200; padding: 24px; background: var(--paper); color: var(--ink); }

@media (max-width: 700px), (orientation: portrait) {
  .plank { padding: 6px 12px 7px; } .plank h1 { font-size: 24px; } .plank p { font-size: 10px; }
  .tools { gap: 6px; } .tool { padding: 0 6px; font-size: 18px; }
  .tool .lbl { display: none; }
  .fanart { display: none; }
}
@media (prefers-reduced-motion: reduce) { .sign { animation: none; } }
```

`src/styles/listview.css`:
```css
.listview { position: fixed; inset: 0; z-index: 30; overflow: auto; background: var(--paper); color: var(--ink); -webkit-user-select: text; user-select: text; }
.lv-inner { max-width: 960px; margin: 0 auto; padding: calc(24px + env(safe-area-inset-top, 0px)) 20px 48px; }
.lv-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.lv-head h2 { margin: 0; font-family: var(--f-hand); font-weight: 400; font-size: 40px; outline: none; }
.lv-close { min-height: 44px; padding: 0 14px; font: 700 15px var(--f-body); color: var(--ink); background: #fff; border: 3px solid var(--ink); border-radius: 10px; cursor: pointer; }
.lv-about { font-size: 17px; line-height: 1.6; max-width: 68ch; }
.lv-cv { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border: 3px solid var(--ink); border-radius: 10px; background: var(--bmo); color: var(--ink); font-weight: 800; text-decoration: none; box-shadow: 0 4px 0 rgba(30, 10, 2, .35); }
.listview h3 { margin: 32px 0 12px; font-family: var(--f-hand); font-weight: 400; font-size: 28px; }
.lv-contacts, .lv-links { display: flex; flex-wrap: wrap; gap: 10px 18px; }
.lv-contacts a, .lv-links a { color: #1d5f8a; font-weight: 700; }
.lv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.lv-card { padding: 16px; border: 3px solid var(--ink); border-top: 12px solid var(--lab); border-radius: 14px; background: #fffaf0; box-shadow: 0 5px 0 rgba(30, 10, 2, .2); }
.lv-card img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 8px; border: 2px solid var(--ink); margin-bottom: 10px; }
.lv-card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.lv-card h4 { margin: 0; font-size: 20px; font-weight: 800; }
.lv-kind { font-size: 14px; color: #7a5a40; font-weight: 700; margin-top: 2px; }
.lv-card p { font-size: 15px; line-height: 1.55; }
.lv-stack { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; margin: 0 0 8px; list-style: none; }
.lv-stack li { font-size: 13px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #efe2c4; border: 1.5px solid var(--ink); }
.listview .chip { font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 999px; border: 2px solid currentColor; white-space: nowrap; color: #7a5a40; }
.listview .chip.live { color: #2c7a3a; }
.lv-foot { margin-top: 40px; font-size: 12px; color: #7a5a40; }
.lv-close:focus-visible, .lv-cv:focus-visible, .listview a:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
```

- [ ] **Step 9: `index.html` üst çubuğunu doğrula**

Görev 1'deki üst çubuk işaretlemesi zaten son halinde olmalı (`btnList` içinde `📋` + `.lbl`, `btnLang` metni `TR`, `btnSound` metni `🔇`). Farklıysa Görev 1 Step 6'daki `<header>` bloğuyla eşitle.

- [ ] **Step 10: `src/main.js`'i son haliyle yeniden yaz**

`src/main.js` (tamamı):
```js
import "./styles/tokens.css";
import "./styles/scene.css";
import "./styles/ui.css";
import "./styles/screen.css";
import "./styles/listview.css";
import { bus, state, store } from "./state.js";
import { PROJECTS, assignSlots } from "./data/projects.js";
import { PROFILE } from "./data/profile.js";
import { t, line, pickLang, applyI18n } from "./data/i18n.js";
import { initStage, NARROW_QUERY } from "./scene/stage.js";
import { SKY_SVG, WALL_SVG, ROOM_SVG, FRONT_SVG, SLOTS } from "./scene/room.svg.js";
import { initParallax } from "./scene/parallax.js";
import { SLICES, sliceForHour, applySlice } from "./scene/daycycle.js";
import { initParticles } from "./scene/particles.js";
import { BMO_SVG } from "./bmo/bmo.svg.js";
import { createFace } from "./bmo/faces.js";
import { initBehavior } from "./bmo/behavior.js";
import { createTapes, placeTapes, bindDrag, relabelTapes } from "./tapes/tape.js";
import { insertTape, ejectTape, missTape } from "./tapes/choreo.js";
import { createSpeech } from "./ui/speech.js";
import { createScreen } from "./ui/screen.js";
import { initTopbar } from "./ui/topbar.js";
import { initListview } from "./ui/listview.js";
import { runLoader } from "./ui/loader.js";
import { createSfx } from "./audio/sfx.js";

const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- tercihler --- */
const forced = new URLSearchParams(location.search).get("t");
state.slice = SLICES.includes(forced) ? forced : sliceForHour(new Date().getHours());
applySlice(document.documentElement, state.slice);
state.lang = pickLang(store.get("lang"), navigator.language);
state.sound = store.get("sound") === "on";
function applyLang() { document.documentElement.lang = state.lang; applyI18n(document, state.lang); }
applyLang();

/* --- sahne (DOM sırası = Tab sırası: kasetler → BMO → nesneler) --- */
$("#l0").innerHTML = SKY_SVG;
$("#l1").innerHTML = WALL_SVG;
$("#l2").innerHTML = `<div class="tapes" id="tapes"></div><div class="bmo" id="bmo">${BMO_SVG}</div>` + ROOM_SVG +
  `<div class="beam"></div><canvas class="particles" id="particles"></canvas>`;
$("#l3").innerHTML = FRONT_SVG;

const view = initStage($("#stage"), { onLayout: (v) => { state.narrow = v.narrow; } });
const parallax = reduced ? null : initParallax([...document.querySelectorAll(".layer")], state);
if (!reduced) initParticles($("#particles"), state);

/* --- BMO --- */
const faceEl = $("#bmo-face");
const face = createFace(faceEl);
face.setBase("idle");
const bmo = initBehavior({ bmoEl: $("#bmo"), faceEl, face, bus, state, reduced });

/* --- ses + konuşma --- */
const sfx = createSfx();
sfx.setEnabled(state.sound);
const speech = createSpeech({
  bubbleEl: $("#speech"), textEl: $("#speechText"), liveEl: $("#live"), anchorEl: $("#bmo"),
  onBlip: () => sfx.play("blip"), onTalk: (on) => face.talk(on), isNarrow: () => state.narrow,
});
bus.on("say", (text) => speech.say(text));
bus.on("sfx", (name) => sfx.play(name));
bus.on("sound:change", (on) => sfx.setEnabled(on));

/* --- kasetler --- */
const { placed } = assignSlots(PROJECTS, SLOTS);
const shelf = placed.map((e) => e.project);
const tapes = createTapes(shelf, state.lang);
function layoutTapes() {
  placeTapes({ tapes, placed, sceneHost: $("#tapes"), trayHost: $("#tray"), narrow: state.narrow, currentId: state.current?.id ?? null });
}
layoutTapes();

/* --- BMO ekranı --- */
const screen = createScreen({ cameraEl: $("#camera"), uiEl: $("#screenUi"), backdropEl: $("#screenBackdrop"), view, state, bus, reduced, parallax, projects: PROJECTS });
addEventListener("resize", () => { speech.place(); screen.relayout(); });
matchMedia(NARROW_QUERY).addEventListener("change", layoutTapes);

/* --- akış: busy kilidi yalnızca burada --- */
const choreo = { tapes, bus, state, reduced, stageEl: $("#l2") };

async function play(p, ghost) {
  if (state.busy) {
    ghost?.remove();
    if (state.current?.id !== p.id) tapes[p.id].classList.remove("gone");
    return;
  }
  state.busy = true;
  try {
    if (state.current?.id === p.id) { ghost?.remove(); tapes[p.id].classList.add("gone"); await screen.open(p); return; }
    if (state.current) { await screen.close(); await ejectTape(state.current, choreo, { quick: true }); }
    await insertTape(p, ghost, choreo);
    await screen.open(p);
  } finally { state.busy = false; }
}

async function eject() {
  if (state.busy || !state.current) return;
  state.busy = true;
  try {
    const p = state.current;
    await screen.close();
    await ejectTape(p, choreo);
    bus.emit("say", t(state.lang, "ejected"));
    tapes[p.id].focus({ preventScroll: true });
  } finally { state.busy = false; }
}

function miss(p, ghost) { missTape(p, ghost, choreo); }

bus.on("screen:closed", eject);
bus.on("tape:loaded", (p) => sfx.startLoop(p.id));
bus.on("tape:ejected", () => sfx.stopLoop());

function overBmo(x, y) {
  const r = $("#bmo-slot").getBoundingClientRect();
  return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < 220 * view.k;
}
const handlers = {
  isBusy: () => state.busy,
  overBmo,
  onReach: (on) => bus.emit("reach", on),
  onInsert: (p, ghost) => play(p, ghost),
  onMiss: (p, ghost) => miss(p, ghost),
};
shelf.forEach((p) => bindDrag(tapes[p.id], p, handlers));
document.addEventListener("tape:pick", () => bus.emit("sfx", "pick"));

/* BMO'ya tıklama: kaset takılıysa ekranı yeniden açar, değilse kıkırdar */
$("#bmo").addEventListener("click", () => {
  if (state.busy) return;
  if (state.current) { play(state.current, null); return; }
  bus.emit("face", { flash: "giggle", ms: 900 });
  bus.emit("sfx", "giggle");
  bus.emit("say", line(state.lang, "click"));
});

/* --- üst çubuk, liste, dil --- */
const listview = initListview({ el: $("#listview"), state, bus, projects: PROJECTS, profile: PROFILE });
initTopbar({ state, bus, store, onList: () => listview.open() });
bus.on("lang:change", () => { applyLang(); relabelTapes(tapes, shelf, state.lang); screen.rerender(); });

/* --- açılış --- */
runLoader({ el: $("#loader"), barEl: $("#loaderBar") }).then(() => {
  bus.emit("say", t(state.lang, "welcome"));
  bmo.wave();
});
```

- [ ] **Step 11: Tüm testleri çalıştır**

Run: `npx vitest run && npx playwright test`
Expected: Tüm birim testler PASS; `screen.spec.js` 3 test PASS.

- [ ] **Step 12: Tarayıcıda elle doğrula**

Yükleme ekranı → sahne açılır, BMO el sallar ve karşılar. `📋 Liste` → sade liste, adres `#liste`; Esc / "Odaya dön" / geri tuşu kapatır. TR/EN düğmesi kasetleri, balonu, listeyi ve açık BMO ekranını çevirir; sayfa yenilenince dil korunur. ☀ düğmesi dilimleri döndürür. 🔇/🔊 düğmesi sesi açar.

- [ ] **Step 13: Commit**

```bash
git add src index.html tests
git commit -m "Üst çubuk, Liste görünümü, yükleme ekranı, dil geçişi

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Finn/Jake nesneleriyle etkileşim

**Files:**
- Create: `src/scene/objects.js`
- Modify: `src/main.js`
- Test: `tests/unit/objects.test.js`

**Interfaces:**
- Consumes: `bus`, `state` (Görev 1), `t` (Görev 2), `ROOM_SVG` içindeki `.obj[data-obj]` grupları (Görev 4), `face`/`sfx`/`say` olayları
- Produces: `initObjects({ root, bus, state, reduced }): void`

- [ ] **Step 1: Başarısız testi yaz**

`tests/unit/objects.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initObjects } from "../../src/scene/objects.js";
import { createBus } from "../../src/state.js";
import { STRINGS } from "../../src/data/i18n.js";

describe("initObjects", () => {
  let bus, state, say, sfx;
  beforeEach(() => {
    document.body.innerHTML = `<svg><g class="obj" data-obj="viola" tabindex="0"></g><g class="obj" data-obj="hat" tabindex="0"></g></svg>`;
    bus = createBus(); state = { lang: "tr", zoomed: false };
    say = vi.fn(); sfx = vi.fn(); bus.on("say", say); bus.on("sfx", sfx);
    initObjects({ root: document, bus, state, reduced: true });
  });

  it("tıklanınca BMO repliği ve nesneye özgü ses", () => {
    document.querySelector('[data-obj="viola"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(say).toHaveBeenCalledWith(STRINGS.tr.obj_viola);
    expect(sfx).toHaveBeenCalledWith("viola");
  });
  it("Enter tuşu tıklama gibi çalışır", () => {
    document.querySelector('[data-obj="hat"]').dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(say).toHaveBeenCalledWith(STRINGS.tr.obj_hat);
  });
  it("BMO ekranı açıkken tepki vermez", () => {
    state.zoomed = true;
    document.querySelector('[data-obj="hat"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(say).not.toHaveBeenCalled();
  });
  it("aria-label dile göre ayarlanır ve dil değişince güncellenir", () => {
    const hat = document.querySelector('[data-obj="hat"]');
    expect(hat.getAttribute("aria-label")).toBe(STRINGS.tr.obj_hat);
    state.lang = "en"; bus.emit("lang:change", "en");
    expect(hat.getAttribute("aria-label")).toBe(STRINGS.en.obj_hat);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run tests/unit/objects.test.js`
Expected: FAIL — modül bulunamıyor.

- [ ] **Step 3: `src/scene/objects.js` yaz**

```js
import { gsap } from "gsap";
import { t } from "../data/i18n.js";

const SOUND = { viola: "viola", gold: "coins" };
const SVGNS = "http://www.w3.org/2000/svg";

function coinBurst(g) {
  const svg = g.ownerSVGElement;
  for (let i = 0; i < 6; i++) {
    const c = document.createElementNS(SVGNS, "ellipse");
    c.setAttribute("class", "c-gold o");
    c.setAttribute("cx", "1520"); c.setAttribute("cy", "880"); c.setAttribute("rx", "12"); c.setAttribute("ry", "12");
    svg.appendChild(c);
    const dx = (Math.random() - 0.5) * 240;
    gsap.timeline({ onComplete: () => c.remove() })
      .to(c, { x: dx / 2, y: -120 - Math.random() * 60, duration: 0.35, ease: "power2.out" })
      .to(c, { x: dx, y: 60, opacity: 0, duration: 0.5, ease: "power2.in" });
  }
}

export function initObjects({ root = document, bus, state, reduced }) {
  const objs = [...root.querySelectorAll(".obj")];
  const label = () => objs.forEach((o) => o.setAttribute("aria-label", t(state.lang, "obj_" + o.dataset.obj)));

  function act(o) {
    if (state.zoomed) return;
    const k = o.dataset.obj;
    bus.emit("say", t(state.lang, "obj_" + k));
    bus.emit("face", { flash: "giggle", ms: 900 });
    if (SOUND[k]) bus.emit("sfx", SOUND[k]);
    if (reduced) return;
    gsap.fromTo(o, { y: 0 }, { y: -10, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out" });
    if (k === "gold") coinBurst(o);
  }

  objs.forEach((o) => {
    o.addEventListener("click", () => act(o));
    o.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(o); } });
  });
  bus.on("lang:change", label);
  label();
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run tests/unit/objects.test.js`
Expected: PASS (4 test)

- [ ] **Step 5: `src/main.js`'e bağla**

Import bloğuna `import { initObjects } from "./scene/objects.js";` ekle; `const bmo = initBehavior(...)` satırından sonra:
```js
initObjects({ root: document, bus, state, reduced });
```

- [ ] **Step 6: Tarayıcıda bak**

Şapka, viola, kılıç, Enchiridion ve hazineye tıkla: her biri parlar, zıplar, BMO kıkırdayıp replik söyler; violada melodi, hazinede altınlar fışkırır (ses açıksa).

- [ ] **Step 7: Commit**

```bash
git add src tests/unit/objects.test.js
git commit -m "Finn/Jake nesneleri: tıklama/klavye etkileşimi, replikler, altın patlaması

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: SEO dosyaları, favicon, OG görseli ve eski dosyaların temizliği

**Files:**
- Create: `public/favicon.svg`, `public/robots.txt`, `scripts/og.mjs`, `public/og-image.png` (script üretir), `public/shots/.gitkeep`
- Delete: `bg.webp`, `teypo.png`

**Interfaces:**
- Consumes: çalışan site (`npm run preview`)
- Produces: statik dosyalar; `index.html` zaten Görev 1'de bunlara bağlı

- [ ] **Step 1: `public/favicon.svg` yaz (BMO yüzü)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="10" fill="#6cc9b5" stroke="#2b1a12" stroke-width="4"/><rect x="12" y="11" width="40" height="30" rx="5" fill="#c9f2c7" stroke="#2b1a12" stroke-width="3"/><circle cx="24" cy="24" r="3" fill="#1f3b33"/><circle cx="40" cy="24" r="3" fill="#1f3b33"/><path d="M27 31q5 5 10 0" fill="none" stroke="#1f3b33" stroke-width="2.5" stroke-linecap="round"/><path d="M14 50h10M19 45v10" stroke="#f3c83a" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="50" r="4" fill="#e2453c" stroke="#2b1a12" stroke-width="1.5"/></svg>
```

- [ ] **Step 2: `public/robots.txt` yaz**

```
User-agent: *
Allow: /
```

- [ ] **Step 3: `scripts/og.mjs` yaz (1200×630 paylaşım görseli)**

```js
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
```

- [ ] **Step 4: OG görselini üret**

Run: `npm run build && (npm run preview &) && node scripts/og.mjs`
Expected: `public/og-image.png yazıldı`. Görseli Read ile aç ve kontrol et: BMO, gün batımı odası ve balon görünüyor.

- [ ] **Step 5: Eski dosyaları sil, ekran görüntüsü klasörünü hazırla**

```bash
git rm bg.webp teypo.png
mkdir -p public/shots && touch public/shots/.gitkeep
```

- [ ] **Step 6: Derlemeyi doğrula**

Run: `npm run build`
Expected: `dist/` içinde `favicon.svg`, `og-image.png`, `robots.txt` var; eski dosyalar yok; hata yok.

- [ ] **Step 7: Commit**

```bash
git add public scripts
git commit -m "Favicon, OG görseli, robots.txt; eski raster görseller kaldırıldı

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Uçtan uca akışlar, duyarlı ekran görüntüleri, Lighthouse ve yayın

**Files:**
- Create: `tests/e2e/flows.spec.js`, `tests/e2e/responsive.spec.js`

**Interfaces:**
- Consumes: tüm site
- Produces: geçen e2e paketi, Lighthouse ölçümü, (onayla) Vercel yayını

- [ ] **Step 1: Akış testlerini yaz**

`tests/e2e/flows.spec.js`:
```js
import { test, expect } from "@playwright/test";

const ready = async (page, url = "/?t=noon") => {
  await page.goto(url);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 5000 });
};

test("sürükle-bırak ile kaset takılır", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tape = await page.locator('.tape[data-id="tbh"] .cas').boundingBox();
  const slot = await page.locator("#bmo-slot").boundingBox();
  await page.mouse.move(tape.x + tape.width / 2, tape.y + tape.height / 2);
  await page.mouse.down();
  await page.mouse.move(tape.x + 40, tape.y - 40, { steps: 5 });
  await page.mouse.move(slot.x + slot.width / 2, slot.y + slot.height / 2, { steps: 15 });
  await page.mouse.up();
  await expect(page.locator("#sTitle")).toHaveText("TBH Trade");
});

test("BMO'dan uzağa bırakılan kaset yerine döner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tapeLoc = page.locator('.tape[data-id="tbh"]');
  const tape = await tapeLoc.locator(".cas").boundingBox();
  await page.mouse.move(tape.x + tape.width / 2, tape.y + tape.height / 2);
  await page.mouse.down();
  await page.mouse.move(200, 200, { steps: 10 });
  await page.mouse.up();
  await expect(tapeLoc).toBeVisible();
  await expect(page.locator("#screenUi")).toBeHidden();
  await expect(page.locator("#speechText")).toContainText("ıskaladın");
});

test("klavye: Enter ile tak, odak ekranda, Esc ile odak kasete döner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const tape = page.locator('.tape[data-id="radar"]');
  await tape.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#sTitle")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#screenUi button.s-eject")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tape).toBeFocused();
});

test("#liste ile hızlı görünüm doğrudan açılır, Esc ile kapanır", async ({ page }) => {
  await ready(page, "/?t=noon#liste");
  await expect(page.locator("#listview")).toBeVisible();
  await expect(page.locator(".lv-card")).toHaveCount(6);
  await expect(page.locator(".lv-about")).toContainText("Mersin");
  await page.keyboard.press("Escape");
  await expect(page.locator("#listview")).toBeHidden();
});

test("TR/EN geçişi metinleri değiştirir ve kalıcıdır", async ({ page }) => {
  await ready(page);
  await page.locator("#btnLang").click();
  await expect(page.locator('.tape[data-id="radar"]')).toContainText("Radar Mines");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.locator('.tape[data-id="radar"]')).toContainText("Radar Mines");
});

test("hareketi azalt: zoom yerine ortada panel açılır", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('.tape[data-id="okey"]').click();
  await expect(page.locator("#screenUi")).toHaveClass(/panel/);
  await expect(page.locator("#sTitle")).toHaveText("81 Okey");
});

test("Finn/Jake nesnesi tıklanınca BMO konuşur", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('[data-obj="viola"]').click();
  await expect(page.locator("#speechText")).toContainText("viola", { timeout: 4000 });
});

test("localStorage engelliyken site açılır", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  await ready(page);
  await expect(page.locator('.tape[data-id="okey"]')).toBeVisible();
});
```

- [ ] **Step 2: Duyarlı ekran görüntüsü testlerini yaz**

`tests/e2e/responsive.spec.js`:
```js
import { test, expect } from "@playwright/test";

for (const [w, h] of [[375, 812], [768, 1024], [1440, 900], [2560, 1440]]) {
  test(`${w}×${h}: yatay kaydırma yok, kasetler erişilebilir, ekran görüntüsü`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/?t=sunset");
    await expect(page.locator("#loader")).toBeHidden({ timeout: 5000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    const tape = page.locator('.tape[data-id="okey"]');
    await tape.scrollIntoViewIfNeeded();
    await expect(tape).toBeVisible();
    await page.screenshot({ path: `test-results/shots/${w}x${h}.png` });
    await tape.click();
    await expect(page.locator("#screenUi")).toBeVisible();
    await page.screenshot({ path: `test-results/shots/${w}x${h}-open.png` });
  });
}
```

- [ ] **Step 3: Tüm e2e paketini çalıştır**

Run: `npx playwright test`
Expected: PASS (3 + 8 + 4 = 15 test). Başarısız test olursa izini incele, ilgili görevin dosyasında düzelt, birim test eklenebiliyorsa ekle, tekrar çalıştır.

- [ ] **Step 4: Ekran görüntülerini incele**

`test-results/shots/*.png` dosyalarını Read ile aç: 375'te BMO üstte ve kasetler alttaki rafta mı, 2560'ta çizgiler keskin mi, açık ekran görüntülerinde metin okunuyor mu? Sorun varsa düzelt ve testi tekrar çalıştır.

- [ ] **Step 5: Lighthouse ölçümü**

Run (preview açıkken):
```bash
npx lighthouse http://localhost:4173/?t=noon --quiet --chrome-flags="--headless=new" --only-categories=performance,accessibility,seo --output=json --output-path=test-results/lh-mobile.json
npx lighthouse http://localhost:4173/?t=noon --quiet --preset=desktop --chrome-flags="--headless=new" --only-categories=performance,accessibility,seo --output=json --output-path=test-results/lh-desktop.json
node -e "for (const f of ['mobile','desktop']) { const r = require('./test-results/lh-' + f + '.json').categories; console.log(f, Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round(v.score * 100)]))); }"
```
Expected: Her iki ölçümde performans ≥ 90, erişilebilirlik ≥ 95, SEO ≥ 95. Altındaysa raporun `audits` bölümündeki başarısız maddeleri düzelt (ör. kontrast, eksik `aria-label`, büyük DOM), ölçümü tekrarla. Performansı düşüren tek etken `body.zoomed` bulanıklığıysa yalnızca açılışta ölçüldüğü için etkisi olmamalı; olursa `filter: blur(4px)` kaldırılıp yalnızca `brightness(.7)` bırakılır.

- [ ] **Step 6: Commit**

```bash
git add tests
git commit -m "Uçtan uca akış ve duyarlı ekran testleri

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 7: YAYIN — kullanıcı onayı**

Kullanıcıya özetle: test sonuçları, Lighthouse skorları, `test-results/shots/` görüntüleri; ve sor: "Vercel'e yayınlayayım mı?" **Onay olmadan yayınlama.**

Onay gelirse:
1. Kullanıcıdan Vercel girişini iste: `! npx vercel login`
2. Run: `npx vercel --prod --yes` (framework Vite otomatik algılanır: build `npm run build`, çıktı `dist`)
3. Dönen URL'yi aç (Playwright MCP), sitenin yüklendiğini ve bir kasetin açıldığını doğrula; URL'yi kullanıcıya ver.
4. `.vercel/` klasörü `.gitignore`'da — commit gerekmez.
