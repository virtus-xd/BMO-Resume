import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFace } from "../../src/bmo/faces.js";

const FAKE = { idle: "I", blink: "B", hungry: "H", talkA: "TA", talkB: "TB", happy: "HP", sad: "S", giggle: "G", loading: "L" };

describe("createFace", () => {
  let el, face;
  beforeEach(() => { vi.useFakeTimers(); el = document.createElement("div"); face = createFace(el, FAKE); });
  afterEach(() => vi.useRealTimers());

  it("setBase yüzü çizer", () => { face.setBase("idle"); expect(el.innerHTML).toBe("I"); });
  it("flash süre dolunca temel yüze döner", () => {
    face.setBase("happy"); face.flash("blink", 130);
    expect(el.innerHTML).toBe("B");
    vi.advanceTimersByTime(131);
    expect(el.innerHTML).toBe("HP");
  });
  it("konuşurken ağız açılıp kapanır, susunca temel yüze döner", () => {
    face.setBase("idle"); face.talk(true);
    const a = el.innerHTML; vi.advanceTimersByTime(110); const b = el.innerHTML;
    expect(new Set([a, b])).toEqual(new Set(["TA", "TB"]));
    face.talk(false);
    expect(el.innerHTML).toBe("I");
  });
  it("flash konuşmanın önüne geçer", () => {
    face.talk(true); face.flash("giggle", 500);
    expect(face.current).toBe("giggle");
  });
});
