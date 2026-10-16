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
