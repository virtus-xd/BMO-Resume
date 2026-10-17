import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTapeButtons, bindDrag } from "../../src/ui/tapeButtons.js";

const P = [
  { id: "a", color: { shell: "#111", label: "#222" }, title: { tr: "Bir", en: "One" } },
  { id: "b", color: { shell: "#333", label: "#444" }, title: { tr: "İki", en: "Two" } },
];
const RECTS = { a: { left: 400, top: 500, width: 120, height: 80 }, b: { left: 700, top: 650, width: 90, height: 60 } };

describe("createTapeButtons", () => {
  let host, trayHost;
  beforeEach(() => {
    document.body.innerHTML = `<div id="host"></div><div id="tray"></div>`;
    host = document.getElementById("host"); trayHost = document.getElementById("tray");
  });
  const make = (narrow, extra = {}) => createTapeButtons({ host, trayHost, projects: P, lang: "tr", rectOf: (id) => RECTS[id], narrow, ...extra });

  it("her proje için data-id'li, erişilebilir buton üretir", () => {
    const { buttons } = make(false);
    expect(buttons.a.tagName).toBe("BUTTON");
    expect(buttons.a.classList.contains("tape")).toBe(true);
    expect(buttons.a.dataset.id).toBe("a");
    expect(buttons.a.getAttribute("aria-label")).toBe("Bir kasetini oynat");
    expect(buttons.a.textContent).toContain("Bir");
  });

  it("geniş düzende düğme yansıtılmış kaset kutusuna oturur", () => {
    const { buttons } = make(false);
    expect(buttons.b.parentElement).toBe(host);
    expect(buttons.b.style.left).toBe("700px");
    expect(buttons.b.style.top).toBe("650px");
    expect(buttons.b.style.width).toBe("90px");
    expect(buttons.b.style.height).toBe("60px");
  });

  it("layout() kutular değişince yeniden hizalar", () => {
    const { buttons, layout } = make(false);
    RECTS.a.left = 410; layout();
    expect(buttons.a.style.left).toBe("410px");
    RECTS.a.left = 400;
  });

  it("dar düzende düğmeler rafa taşınır, konum stilleri temizlenir, küçük resim görünür", () => {
    const { buttons } = make(true, { thumbOf: (id) => `data:image/png;base64,${id}` });
    expect(buttons.a.parentElement).toBe(trayHost);
    expect(buttons.a.style.left).toBe("");
    expect(buttons.a.querySelector("img").getAttribute("src")).toBe("data:image/png;base64,a");
  });

  it("küçük resim Promise olarak gelebilir: hazır olunca yerleşir, o ana kadar kaset renginde yer tutucu", async () => {
    const resolvers = {};
    const { buttons } = make(true, { thumbOf: (id) => new Promise((r) => { resolvers[id] = r; }) });
    const img = buttons.a.querySelector("img");
    expect(img.getAttribute("src")).toBeNull();
    expect(buttons.a.style.getPropertyValue("--shell")).toBe("#111");
    resolvers.a("data:image/png;base64,x");
    await Promise.resolve();
    expect(img.getAttribute("src")).toBe("data:image/png;base64,x");
  });

  it("dar düzen bir fonksiyonla da verilebilir ve layout() düzen değişimini izler", () => {
    let narrow = false;
    const { buttons, layout } = make(() => narrow);
    expect(buttons.a.parentElement).toBe(host);
    narrow = true; layout();
    expect(buttons.a.parentElement).toBe(trayHost);
  });

  it("setGone düğmeye gone sınıfını ekler/kaldırır", () => {
    const { buttons, setGone } = make(false);
    setGone("a", true); expect(buttons.a.classList.contains("gone")).toBe(true);
    setGone("a", false); expect(buttons.a.classList.contains("gone")).toBe(false);
  });

  it("relabel dil değişince aria-label ve metni günceller", () => {
    const { buttons, relabel } = make(false);
    relabel("en");
    expect(buttons.a.getAttribute("aria-label")).toBe("Play the One tape");
    expect(buttons.a.textContent).toContain("One");
  });
});

describe("bindDrag", () => {
  let el, h;
  const ev = (type, x, y, extra = {}) => {
    const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, ...extra });
    Object.defineProperty(e, "pointerId", { value: 1 });
    el.dispatchEvent(e);
  };
  beforeEach(() => {
    document.body.innerHTML = `<button id="t"></button>`;
    el = document.getElementById("t");
    h = { isBusy: vi.fn(() => false), onTap: vi.fn(), onPick: vi.fn(), onDrag: vi.fn(() => false), onDrop: vi.fn(), onCancel: vi.fn(), onReach: vi.fn() };
    bindDrag(el, "a", h);
  });

  it("kıpırdamadan bırakmak dokunmadır", () => {
    ev("pointerdown", 100, 100); ev("pointerup", 101, 100);
    expect(h.onTap).toHaveBeenCalledWith("a");
    expect(h.onPick).not.toHaveBeenCalled();
  });
  it("7 px'ten fazla sürükleme kaseti kaldırır, bırakınca onDrop", () => {
    ev("pointerdown", 100, 100); ev("pointermove", 120, 90); ev("pointermove", 200, 60); ev("pointerup", 200, 60);
    expect(h.onPick).toHaveBeenCalledWith("a", 120, 90);
    expect(h.onDrag).toHaveBeenLastCalledWith("a", 200, 60, expect.any(Number));
    expect(h.onDrop).toHaveBeenCalledWith("a", 200, 60);
    expect(h.onTap).not.toHaveBeenCalled();
  });
  it("yaklaşınca onReach(true), bırakınca onReach(false)", () => {
    h.onDrag.mockReturnValue(true);
    ev("pointerdown", 100, 100); ev("pointermove", 130, 100); ev("pointerup", 130, 100);
    expect(h.onReach.mock.calls).toEqual([[true], [false]]);
  });
  it("pointercancel ve lostpointercapture ıskalama sayılır", () => {
    ev("pointerdown", 100, 100); ev("pointermove", 140, 100); ev("pointercancel", 140, 100);
    expect(h.onCancel).toHaveBeenCalledWith("a");
    ev("pointerdown", 100, 100); ev("pointermove", 140, 100); ev("lostpointercapture", 140, 100);
    expect(h.onCancel).toHaveBeenCalledTimes(2);
    expect(h.onDrop).not.toHaveBeenCalled();
  });
  it("bırakmadan sonra gelen lostpointercapture ikinci kez tetiklemez", () => {
    ev("pointerdown", 100, 100); ev("pointermove", 140, 100); ev("pointerup", 140, 100); ev("lostpointercapture", 140, 100);
    expect(h.onDrop).toHaveBeenCalledTimes(1);
    expect(h.onCancel).not.toHaveBeenCalled();
  });
  it("meşgulken kaset kapılmaz", () => {
    h.isBusy.mockReturnValue(true);
    ev("pointerdown", 100, 100); ev("pointermove", 160, 100); ev("pointerup", 160, 100);
    expect(h.onPick).not.toHaveBeenCalled();
    expect(h.onTap).not.toHaveBeenCalled();
  });
  /* parmak telefonda yavaş başlar: olaylar 1–4 px arayla gelir */
  const swipe = (steps) => { let x = 100, y = 100; ev("pointerdown", x, y); for (const [dx, dy] of steps) { x += dx; y += dy; ev("pointermove", x, y); } };
  const inTray = () => { document.body.innerHTML = `<div class="tray"><button id="t"></button></div>`; el = document.getElementById("t"); bindDrag(el, "a", h); };
  it("rafta yana kaydırmak (yavaş başlasa da) kaseti kaldırmaz, ıskalama da sayılmaz", () => {
    inTray();
    for (const step of [1, 2, 4]) {
      swipe(Array.from({ length: 30 }, () => [-step, 0])); ev("pointercancel", 0, 100);
      swipe(Array.from({ length: 30 }, (_, i) => [step, i < 4 ? -1 : 0])); ev("pointercancel", 0, 100); // başparmak hafif yukarı kayar
    }
    expect(h.onPick).not.toHaveBeenCalled();
    expect(h.onCancel).not.toHaveBeenCalled();
  });
  it("rafta yukarı çekmek kaseti kaldırır", () => {
    inTray();
    swipe(Array.from({ length: 10 }, () => [1, -3])); ev("pointerup", 110, 70);
    expect(h.onPick).toHaveBeenCalled();
    expect(h.onDrop).toHaveBeenCalled();
  });
  it("odada (raf dışında) yana sürüklemek kaseti kaldırır", () => {
    swipe(Array.from({ length: 10 }, () => [-2, 0]));
    expect(h.onPick).toHaveBeenCalled();
  });
  it("klavye tıklaması (detail 0) dokunma sayılır", () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
    expect(h.onTap).toHaveBeenCalledWith("a");
  });
});
