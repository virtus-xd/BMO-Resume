import { describe, it, expect } from "vitest";
import { sliceForHour, nextSlice, applySlice, SLICES } from "../../src/scene/daycycle.js";

describe("sliceForHour", () => {
  it.each([
    [5, "night"], [6, "morning"], [10, "morning"], [11, "noon"],
    [16, "noon"], [17, "sunset"], [19, "sunset"], [20, "night"], [0, "night"], [23, "night"],
  ])("%i:xx → %s", (h, s) => expect(sliceForHour(h)).toBe(s));
});

describe("nextSlice", () => {
  it("sırayla döner ve geceden sabaha sarar", () => {
    expect(nextSlice("morning")).toBe("noon");
    expect(nextSlice("night")).toBe("morning");
  });
});

describe("applySlice", () => {
  it("yalnızca seçili dilim sınıfını bırakır", () => {
    const el = document.createElement("html");
    applySlice(el, "night"); applySlice(el, "sunset");
    expect(el.classList.contains("t-sunset")).toBe(true);
    expect(SLICES.filter((s) => el.classList.contains("t-" + s))).toEqual(["sunset"]);
  });
});
