import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createTape3D } from "../../src/three/tapes.js";
import { wrapTitle } from "../../src/three/layout.js";
import { PROJECTS } from "../../src/data/projects.js";
import { loc } from "../../src/data/i18n.js";

const okey = PROJECTS.find((p) => p.id === "okey");
const radar = PROJECTS.find((p) => p.id === "radar");

describe("createTape3D", () => {
  let getContext;
  beforeAll(() => { getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null); });
  afterAll(() => getContext.mockRestore());

  it("pencerede iki makara mesh'i var", () => {
    const tape = createTape3D(okey, "tr");
    const reels = [];
    tape.group.traverse((o) => { if (o.isMesh && o.name === "reel") reels.push(o); });
    expect(reels).toHaveLength(2);
    expect(tape.id).toBe("okey");
  });

  it("setLabel dili değiştirince etiket satırları wrapTitle(…, 12) ile aynı", () => {
    const tape = createTape3D(radar, "tr");
    const label = tape.group.getObjectByName("label");
    expect(label.userData.lines).toEqual(wrapTitle(loc("tr", radar.title), 12));
    tape.setLabel("en");
    expect(label.userData.lines).toEqual(wrapTitle(loc("en", radar.title), 12));
  });

  it("uzun başlık iki satıra sarılır", () => {
    const tape = createTape3D(PROJECTS.find((p) => p.id === "davetiye"), "tr");
    expect(tape.group.getObjectByName("label").userData.lines).toEqual(["Sanal", "Davetiyecim"]);
  });

  it("ekran görüntüsü varsa etiketin yerine kapak görseli", () => {
    const withShot = { ...okey, shots: ["/shots/okey-1.webp", "/shots/okey-2.webp"] };
    expect(createTape3D(withShot, "tr").group.getObjectByName("label").userData.cover).toBe("/shots/okey-1.webp");
    expect(createTape3D(okey, "tr").group.getObjectByName("label").userData.cover).toBeNull();
  });

  it("gövde proje shell renginde", () => {
    const tape = createTape3D(okey, "tr");
    expect("#" + tape.group.getObjectByName("shell").material.color.getHexString()).toBe(okey.color.shell);
  });
});
