import { describe, it, expect, beforeEach } from "vitest";
import { createTapeButtons } from "../../src/ui/tapeButtons.js";

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
