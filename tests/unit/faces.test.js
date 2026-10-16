import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFace, FACE_NAMES } from "../../src/bmo/faces.js";

describe("createFace", () => {
  let render, face;
  beforeEach(() => { vi.useFakeTimers(); render = vi.fn(); face = createFace(render); });
  afterEach(() => vi.useRealTimers());

  it("setBase yüzü çizdirir", () => { face.setBase("idle"); expect(render).toHaveBeenLastCalledWith("idle"); });
  it("flash süre dolunca temel yüze döner", () => {
    face.setBase("happy"); face.flash("blink", 130);
    expect(render).toHaveBeenLastCalledWith("blink");
    vi.advanceTimersByTime(131);
    expect(render).toHaveBeenLastCalledWith("happy");
  });
  it("konuşurken ağız açılıp kapanır, susunca temel yüze döner", () => {
    face.setBase("idle"); face.talk(true);
    const a = render.mock.lastCall[0]; vi.advanceTimersByTime(110); const b = render.mock.lastCall[0];
    expect(new Set([a, b])).toEqual(new Set(["talkA", "talkB"]));
    face.talk(false);
    expect(render).toHaveBeenLastCalledWith("idle");
  });
  it("flash konuşmanın önüne geçer", () => {
    face.talk(true); face.flash("giggle", 500);
    expect(face.current).toBe("giggle");
  });
  it("aynı yüz art arda istenirse yeniden çizdirmez", () => {
    face.setBase("happy"); face.setBase("happy");
    expect(render).toHaveBeenCalledTimes(1);
  });
  it("v1'in ifade adları korunur", () => {
    expect(FACE_NAMES).toEqual(["idle", "blink", "hungry", "talkA", "talkB", "happy", "sad", "giggle", "loading"]);
  });
});
