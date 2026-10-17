import { describe, it, expect } from "vitest";
import { renderScreen, visibleRegion, paintCtl } from "../../src/ui/screen.js";
import { t } from "../../src/data/i18n.js";
import { esc } from "../../src/ui/html.js";

describe("visibleRegion", () => {
  it("16:9 ekranda kırpılmamış bölge merkezde ve neredeyse tüm stage", () => {
    const k = (1920 / 1920) * 1.04;
    const v = visibleRegion({ k, oy: 0 }, 1920, 1080);
    expect(v.cx).toBeCloseTo(0); expect(v.cy).toBeCloseTo(0);
    expect(v.w).toBeCloseTo(2 / 1.04); expect(v.h).toBeCloseTo(2 / 1.04);
  });
  it("geniş ekranda dikey kırpma: görünür yükseklik azalır", () => {
    const k = Math.max(1920 / 1920, 937 / 1080) * 1.04;
    const v = visibleRegion({ k, oy: 0 }, 1920, 937);
    expect(v.h).toBeLessThan(v.w);
    expect(v.h).toBeCloseTo((937 / k / 1080) * 2);
  });
  it("üst/alt pay görünür bölgeyi daraltır ve merkezi kaydırır", () => {
    const k = 1;
    const a = visibleRegion({ k, oy: 0 }, 1000, 800);
    const b = visibleRegion({ k, oy: 0 }, 1000, 800, { top: 100, bottom: 0 });
    expect(b.h).toBeCloseTo(a.h - (100 / 1080) * 2);
    expect(b.cy).toBeLessThan(a.cy); // alt yarıya kayar (NDC y aşağı negatif)
  });
  it("dar düzende stage kaydırması (oy) merkezi taşır", () => {
    const v = visibleRegion({ k: 1, oy: -100 }, 400, 800);
    /* ekran merkezi stage merkezinin 100 px altında görünür → NDC y negatif */
    expect(v.cy).toBeCloseTo(-(100 / 1080) * 2);
  });
  it("görünür bölge stage dışına taşmaz (canvas yalnız stage'i kaplar)", () => {
    const v = visibleRegion({ k: 1, oy: -300 }, 400, 800);
    expect(1 - v.cy + v.h / 2).toBeLessThanOrEqual(2 + 1e-9); // alt kenar NDC -1'in altına inmez
    expect(v.cy - v.h / 2).toBeGreaterThanOrEqual(-1 - 1e-9);
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

describe("ekran simgeleri (sağ üst: ses, gün saati, dil, liste)", () => {
  const base = { id: "x", status: "live", title: { tr: "Başlık" }, kind: { tr: "Tür" }, desc: { tr: "Açıklama" }, stack: [], shots: [], links: [] };
  const b = (n) => document.querySelector(`.s-ctl [data-ctl=${n}]`);
  it("dört simge durumlarıyla ve erişilebilir adlarıyla çıkar", () => {
    document.body.innerHTML = renderScreen(base, "tr", 0, 1, { sound: true, slice: "night" });
    expect(b("sound").getAttribute("aria-pressed")).toBe("true");
    expect(b("time").textContent).toBe("☾");
    expect(b("lang").textContent).toBe("TR");
    for (const n of ["sound", "time", "lang", "list"]) {
      expect(b(n).tagName).toBe("BUTTON");
      expect(b(n).getAttribute("aria-label")).toBeTruthy();
    }
    expect(b("lang").getAttribute("aria-label")).toBe(t("tr", "lang_aria"));
  });
  it("paintCtl simgeleri yerinde günceller (düğme değişmez, odak kaybolmaz)", () => {
    document.body.innerHTML = renderScreen(base, "tr", 0, 1, { sound: false, slice: "noon" });
    const s = b("sound");
    expect(s.getAttribute("aria-pressed")).toBe("false");
    paintCtl(document.body, { sound: true, slice: "night" });
    expect(b("sound")).toBe(s);
    expect(s.getAttribute("aria-pressed")).toBe("true");
    expect(b("time").textContent).toBe("☾");
  });
});
