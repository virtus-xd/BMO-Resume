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
