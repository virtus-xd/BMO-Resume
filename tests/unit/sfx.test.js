import { describe, it, expect, vi } from "vitest";
import { tuneFor, SCALE, createSfx } from "../../src/audio/sfx.js";

describe("tuneFor", () => {
  it("aynı id için hep aynı 8 notayı verir, notalar gamdan", () => {
    const a = tuneFor("okey");
    expect(a).toHaveLength(8);
    expect(tuneFor("okey")).toEqual(a);
    a.forEach((f) => expect(SCALE).toContain(f));
  });
});

describe("createSfx", () => {
  it("ses kapalıyken AudioContext oluşturmaz", () => {
    const AC = vi.fn();
    const sfx = createSfx({ AudioContext: AC });
    sfx.play("pick"); sfx.startLoop("okey");
    expect(AC).not.toHaveBeenCalled();
  });
  const fakeAC = () => {
    const node = () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), type: "", frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } });
    return vi.fn(function () { return { state: "running", currentTime: 0, destination: {}, createOscillator: node, createGain: node, resume: vi.fn() }; });
  };
  it("ses açık olsa bile kullanıcı etkileşimi (unlock) olmadan AudioContext kurulmaz", () => {
    const AC = fakeAC();
    const sfx = createSfx({ AudioContext: AC });
    sfx.setEnabled(true);
    sfx.play("pick");
    expect(AC).not.toHaveBeenCalled();
    sfx.unlock();
    sfx.play("pick");
    expect(AC).toHaveBeenCalledTimes(1);
  });
  it("kaset takılıyken ses açılınca chiptune başlar", () => {
    vi.useFakeTimers();
    const AC = fakeAC();
    const sfx = createSfx({ AudioContext: AC });
    sfx.unlock();
    sfx.setEnabled(true, "okey");
    vi.advanceTimersByTime(200);
    expect(AC).toHaveBeenCalled();
    sfx.setEnabled(false);
    vi.useRealTimers();
  });
  it("AudioContext yoksa ses açıkken de hata vermez", () => {
    const sfx = createSfx({});
    sfx.setEnabled(true);
    expect(() => sfx.play("clunk")).not.toThrow();
  });
});
