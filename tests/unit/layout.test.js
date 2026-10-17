import { describe, it, expect } from "vitest";
import { Vector3, PerspectiveCamera } from "three";
import {
  CAMERA, BMO, TAPE_SLOTS, TAPE_SCALE, makeCamera, projectToStage, projectRect, inSafeBand, zoomPose, wrapTitle,
} from "../../src/three/layout.js";
import { PROJECTS } from "../../src/data/projects.js";

describe("wrapTitle", () => {
  it("kelimeden böler", () => expect(wrapTitle("Sanal Davetiyecim", 10)).toEqual(["Sanal", "Davetiyecim"]));
  it("sığan başlık tek satır", () => expect(wrapTitle("81 Okey", 10)).toEqual(["81 Okey"]));
  it("en fazla 2 satır; sığmazsa ikinci satır … ile biter", () => {
    const lines = wrapTitle("Çok uzun bir proje başlığı burada", 10);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
    expect(lines[1].length).toBeLessThanOrEqual(10);
  });
});

describe("makeCamera / projectRect", () => {
  it("kamera CAMERA sabitlerinden kurulur", () => {
    const cam = makeCamera();
    expect(cam).toBeInstanceOf(PerspectiveCamera);
    expect(cam.fov).toBe(CAMERA.fov);
    expect(cam.position.toArray()).toEqual(CAMERA.position);
  });
  it("bakış noktasındaki küçük kare stage merkezini içerir", () => {
    const cam = makeCamera();
    const [x, y, z] = CAMERA.target;
    const pts = [[-0.1, -0.1], [0.1, -0.1], [0.1, 0.1], [-0.1, 0.1]].map(([dx, dy]) => new Vector3(x + dx, y + dy, z));
    const r = projectRect(cam, pts);
    expect(r.left).toBeLessThan(960); expect(r.left + r.width).toBeGreaterThan(960);
    expect(r.top).toBeLessThan(540); expect(r.top + r.height).toBeGreaterThan(540);
  });
  it("bakış noktası stage merkezine yansır", () => {
    const p = projectToStage(makeCamera(), new Vector3(...CAMERA.target));
    expect(p.x).toBeCloseTo(960, 3); expect(p.y).toBeCloseTo(540, 3);
  });
});

describe("zoomPose", () => {
  /* hafif yana dönük bir ekran (BMO dönük durur) */
  const a = 0.45;
  const frame = { center: new Vector3(0.2, 0.9, 0.5), normal: new Vector3(Math.sin(a), 0, Math.cos(a)), up: new Vector3(0, 1, 0), width: 0.74, height: 0.52 };
  const right = new Vector3().crossVectors(frame.up, frame.normal).normalize();
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => frame.center.clone()
    .addScaledVector(right, (sx * frame.width) / 2).addScaledVector(frame.up, (sy * frame.height) / 2));
  const place = (pose) => {
    const cam = makeCamera();
    cam.position.copy(pose.position); cam.lookAt(pose.target); cam.updateMatrixWorld();
    return cam;
  };

  it("tüm görünür alanda ekran ortalanır ve fill sınırını aşmaz", () => {
    const cam = place(zoomPose(frame, CAMERA.fov, 16 / 9, { cx: 0, cy: 0, w: 2, h: 2 }, 0.8));
    const r = projectRect(cam, corners);
    expect(r.left + r.width / 2).toBeCloseTo(960, 0);
    expect(r.top + r.height / 2).toBeCloseTo(540, 0);
    expect(Math.abs(r.left + r.width / 2 - 960)).toBeLessThanOrEqual(1);
    expect(r.width).toBeLessThanOrEqual(0.8 * 1920 + 1);
    expect(r.height).toBeLessThanOrEqual(0.8 * 1080 + 1);
    expect(Math.max(r.width / (0.8 * 1920), r.height / (0.8 * 1080))).toBeGreaterThan(0.99);
  });

  it("kırpılmış görünür bölgede ekran merkezi o bölgenin merkezine düşer", () => {
    const vis = { cx: 0.2, cy: -0.1, w: 0.6, h: 1.2 };
    const cam = place(zoomPose(frame, CAMERA.fov, 16 / 9, vis, 0.8));
    const c = frame.center.clone().project(cam);
    expect(Math.abs(c.x - 0.2)).toBeLessThan(0.01);
    expect(Math.abs(c.y + 0.1)).toBeLessThan(0.01);
    const r = projectRect(cam, corners);
    expect(r.width).toBeLessThanOrEqual(0.8 * 0.6 * 960 + 1);
    expect(r.height).toBeLessThanOrEqual(0.8 * 1.2 * 540 + 1);
  });
});

describe("yerleşim sabitleri", () => {
  const cam = makeCamera();
  const box = ([x, y, z], hx, h, hz) => [
    [-hx, 0, -hz], [hx, 0, -hz], [hx, 0, hz], [-hx, 0, hz], [-hx, h, -hz], [hx, h, -hz], [hx, h, hz], [-hx, h, hz],
  ].map(([dx, dy, dz]) => new Vector3(x + dx, y + dy, z + dz));

  it("her proje için bir kaset yuvası var (fazla proje odada sessizce kaybolmaz)", () => {
    expect(TAPE_SLOTS.length).toBeGreaterThanOrEqual(PROJECTS.length);
  });
  it("8 kaset yuvası zeminde ve BMO'ya 0.95–2.4 birim uzaklıkta", () => {
    expect(TAPE_SLOTS).toHaveLength(8);
    const b = new Vector3(...BMO.position);
    TAPE_SLOTS.forEach((s) => {
      expect(s.position[1]).toBe(0);
      const d = new Vector3(...s.position).distanceTo(b);
      expect(d).toBeGreaterThanOrEqual(0.95); expect(d).toBeLessThanOrEqual(2.4);
    });
  });
  /* kasetin sınırlayıcı kutusu: ölçeklenmemiş ±0.35 × 0.44 yükseklik, TAPE_SCALE ile */
  const tapeBox = (s) => box(s.position, 0.35 * TAPE_SCALE, 0.44 * TAPE_SCALE, 0.35 * TAPE_SCALE);
  it("her kaset güvenli bantta", () => {
    TAPE_SLOTS.forEach((s) => expect(inSafeBand(projectRect(cam, tapeBox(s)))).toBe(true));
  });
  it("yansıtılmış kasetler birbiriyle ve BMO ile çakışmaz", () => {
    const k = BMO.scale;
    const rects = [...TAPE_SLOTS.map((s) => projectRect(cam, tapeBox(s))), projectRect(cam, box(BMO.position, 0.55 * k, 1.3 * k, 0.5 * k))];
    const hit = (a, b) => a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;
    rects.forEach((a, i) => rects.forEach((b, j) => { if (i < j) expect(hit(a, b), `${i}↔${j}`).toBe(false); }));
  });
  it("BMO (oturan gövdesi ve kollarıyla) güvenli bantta", () => {
    const k = BMO.scale;
    expect(inSafeBand(projectRect(cam, box(BMO.position, 0.8 * k, 1.3 * k, 0.9 * k)))).toBe(true);
  });
  it("inSafeBand sınırları x 240–1680, y 95–985", () => {
    expect(inSafeBand({ left: 240, top: 95, width: 1440, height: 890 })).toBe(true);
    expect(inSafeBand({ left: 239, top: 95, width: 10, height: 10 })).toBe(false);
    expect(inSafeBand({ left: 300, top: 95, width: 1381, height: 10 })).toBe(false);
    expect(inSafeBand({ left: 300, top: 94, width: 10, height: 10 })).toBe(false);
    expect(inSafeBand({ left: 300, top: 900, width: 10, height: 86 })).toBe(false);
  });
});

describe("stage ile uyum", () => {
  it("stage.js'teki BMO_CENTER_Y yansıtılmış BMO merkeziyle (±12 px) aynı", async () => {
    const { BMO_CENTER_Y } = await import("../../src/scene/stage.js");
    const k = BMO.scale, [x, , z] = BMO.position;
    const pts = [[-0.55, 0, -0.5], [0.55, 0, 0.5], [-0.55, 1.3, -0.5], [0.55, 1.3, 0.5]].map(([a, b, c]) => new Vector3(x + a * k, b * k, z + c * k));
    const r = projectRect(makeCamera(), pts);
    expect(Math.abs(r.top + r.height / 2 - BMO_CENTER_Y)).toBeLessThanOrEqual(12);
  });
});
