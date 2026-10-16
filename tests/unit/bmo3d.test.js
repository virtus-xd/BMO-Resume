import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { Mesh, Vector3 } from "three";
import { createBmo } from "../../src/three/bmo.js";
import { toonMaterial, withOutline, rimLight } from "../../src/three/toon.js";

describe("createBmo", () => {
  let bmo, getContext;
  /* jsdom'da canvas yok: getContext null döner, yüz çizimi atlanmalı ama model kurulmalı */
  beforeAll(() => {
    getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    bmo = createBmo();
    bmo.group.updateMatrixWorld(true);
  });
  afterAll(() => getContext.mockRestore());

  it("detaylı model: en az 30 mesh", () => {
    let n = 0;
    bmo.group.traverse((o) => { if (o.isMesh) n++; });
    expect(n).toBeGreaterThanOrEqual(30);
  });

  it("ekran dünya +z'ye bakar (dönüş yokken)", () => {
    const f = bmo.screenFrame();
    expect(f.normal.z).toBeGreaterThan(0.99);
    expect(f.up.y).toBeGreaterThan(0.99);
    expect(f.width / f.height).toBeCloseTo(0.74 / 0.52, 2);
  });

  it("ekran köşeleri 4 nokta, en/boy oranı 0.74/0.52", () => {
    const c = bmo.screenCorners();
    expect(c).toHaveLength(4);
    c.forEach((p) => expect(p).toBeInstanceOf(Vector3));
    const w = c[0].distanceTo(c[1]), h = c[1].distanceTo(c[2]);
    expect(Math.abs(w / h - 0.74 / 0.52)).toBeLessThan(0.01);
  });

  it("setLid(1) kapağı 0.15'e katlar, setLid(0) geri açar", () => {
    const lid = bmo.group.getObjectByName("lid");
    bmo.setLid(1); expect(lid.scale.y).toBeCloseTo(0.15);
    bmo.setLid(0); expect(lid.scale.y).toBeCloseTo(1);
  });

  it("yuva ekranın altında ve önde", () => {
    const s = bmo.slotWorld(), f = bmo.screenFrame();
    expect(s.y).toBeLessThan(f.center.y);
    expect(s.z).toBeGreaterThan(0.25);
  });

  it("makaralar yalnız kaset takılıyken görünür", () => {
    const reels = [];
    bmo.group.traverse((o) => { if (o.name === "bmoReel") reels.push(o); });
    expect(reels).toHaveLength(2);
    bmo.setReels(true); expect(reels.every((r) => r.visible)).toBe(true);
    bmo.setReels(false); expect(reels.some((r) => r.visible)).toBe(false);
  });

  it("yüz canvas'ı 512×360 ve setFace çizim bağlamı yokken hata vermez", () => {
    expect(bmo.faceCanvas.width).toBe(512);
    expect(bmo.faceCanvas.height).toBe(360);
    expect(() => bmo.setFace("happy", { x: 2, y: -1 })).not.toThrow();
  });
});

describe("toon", () => {
  it("withOutline mesh'e ters yüzlü kabuk ekler", () => {
    const m = withOutline(new Mesh(undefined, toonMaterial(0xff0000)), 0.02);
    expect(m.children).toHaveLength(1);
    expect(m.children[0].material.side).toBe(1); // BackSide
  });
  it("rimLight malzemeye kenar ışığı değerlerini ekler", () => {
    const mat = rimLight(toonMaterial(0x00ff00), 0xffffff, 0.4);
    expect(mat.userData.rim.strength).toBe(0.4);
  });
});
