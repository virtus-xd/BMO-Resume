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
