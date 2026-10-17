import { describe, it, expect, vi } from "vitest";
import { renderList, initListview } from "../../src/ui/listview.js";
import { createBus } from "../../src/state.js";
import { t } from "../../src/data/i18n.js";
import { PROJECTS } from "../../src/data/projects.js";

const EMPTY = { name: "Erdem", email: "", github: "", linkedin: "", cv: { tr: "", en: "" } };

describe("renderList", () => {
  it("Hakkımda metnini tanıtım olarak, diğer 8 projeyi kart olarak gösterir", () => {
    document.body.innerHTML = renderList(PROJECTS, EMPTY, "tr");
    expect(document.querySelector(".lv-about").textContent).toContain("Mersin Üniversitesi");
    expect(document.querySelectorAll(".lv-card")).toHaveLength(8);
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
  it("3D yoksa başta not çıkar ve odaya dönüş düğmesi gizlenir", () => {
    const html = renderList(PROJECTS, EMPTY, "tr", { no3d: true });
    document.body.innerHTML = html;
    expect(document.querySelector(".lv-no3d").textContent).toContain("3D sahneyi desteklemiyor");
    expect(document.querySelector("[data-act=close]")).toBeNull();
    expect(renderList(PROJECTS, EMPTY, "tr")).not.toContain("lv-no3d");
  });
});


describe("3D yokken dil düğmesi", () => {
  it("başlıkta dil düğmesi çıkar (3D varken çıkmaz)", () => {
    document.body.innerHTML = renderList(PROJECTS, EMPTY, "tr", { no3d: true });
    const b = document.querySelector("[data-act=lang]");
    expect(b.textContent).toBe("TR");
    expect(b.getAttribute("aria-label")).toBe(t("tr", "lang_aria"));
    expect(renderList(PROJECTS, EMPTY, "tr")).not.toContain('data-act="lang"');
  });
  it("tıklanınca ctl olayıyla dil değişimi istenir", () => {
    document.body.innerHTML = `<div id="lv" hidden></div>`;
    const bus = createBus(), fn = vi.fn();
    bus.on("ctl", fn);
    const lv = initListview({ el: document.getElementById("lv"), state: { lang: "tr" }, bus, projects: PROJECTS, profile: EMPTY });
    lv.setNo3d(true);
    document.querySelector("[data-act=lang]").click();
    expect(fn).toHaveBeenCalledWith("lang");
  });
});
