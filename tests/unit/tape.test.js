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
