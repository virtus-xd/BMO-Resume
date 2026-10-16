import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFlow } from "../../src/ui/flow.js";
import { createBus } from "../../src/state.js";

const A = { id: "a", title: { tr: "A" }, line: { tr: "a!" } };
const B = { id: "b", title: { tr: "B" }, line: { tr: "b!" } };

describe("createFlow", () => {
  let calls, anim, screen, buttons, bus, state, flow;
  beforeEach(() => {
    calls = [];
    const rec = (name) => vi.fn(async (...args) => { calls.push([name, ...args.filter((x) => typeof x === "string")]); });
    anim = { insert3D: rec("insert3D"), eject3D: rec("eject3D"), miss3D: rec("miss3D"), notes: vi.fn() };
    screen = { open: rec("open"), close: rec("close") };
    buttons = { setGone: vi.fn(), focus: vi.fn() };
    bus = createBus();
    state = { current: null, busy: false, lang: "tr", zoomed: false };
    flow = createFlow({ anim, buttons, bus, state, screen });
  });

  it("takma sürerken ikinci play yok sayılır", async () => {
    const first = flow.play(A);
    const second = flow.play(B);
    await Promise.all([first, second]);
    expect(anim.insert3D).toHaveBeenCalledTimes(1);
    expect(state.current).toBe(A);
    expect(await second).toBe(false);
  });

  it("play bitince kaset yüklü, ekran açılmış, kilit kalkmış", async () => {
    await flow.play(A);
    expect(state.current).toBe(A);
    expect(screen.open).toHaveBeenCalledWith(A);
    expect(buttons.setGone).toHaveBeenCalledWith("a", true);
    expect(flow.isBusy()).toBe(false);
    expect(state.busy).toBe(false);
  });

  it("close ekranı kapatır, kaset BMO'da kalır", async () => {
    await flow.play(A);
    await flow.close();
    expect(screen.close).toHaveBeenCalled();
    expect(state.current).toBe(A);
    expect(anim.eject3D).not.toHaveBeenCalled();
  });

  it("close kilidi kameranın geri dönüşünü beklemez (hemen yeniden etkileşim)", async () => {
    await flow.play(A);
    screen.close.mockImplementationOnce(() => new Promise(() => {}));
    await flow.close();
    expect(flow.isBusy()).toBe(false);
    expect(await flow.play(A)).toBe(true);
  });

  it("aynı kaset yüklüyken play yalnız ekranı açar", async () => {
    await flow.play(A);
    await flow.close();
    calls.length = 0;
    await flow.play(A);
    expect(calls).toEqual([["open"]]);
  });

  it("başka kaset yüklüyken play önce çıkarır sonra takar", async () => {
    await flow.play(A);
    calls.length = 0;
    await flow.play(B);
    expect(calls).toEqual([["close"], ["eject3D", "a"], ["insert3D", "b"], ["open"]]);
    expect(state.current).toBe(B);
    expect(buttons.setGone).toHaveBeenCalledWith("a", false);
  });

  it("ıskalama sürerken play yok sayılır", async () => {
    const m = flow.miss(A);
    const p = flow.play(B);
    await Promise.all([m, p]);
    expect(anim.miss3D).toHaveBeenCalledWith("a");
    expect(anim.insert3D).not.toHaveBeenCalled();
    expect(await p).toBe(false);
  });

  it("eject kaseti yerine döndürür, odağı kasete verir, sonra boşta", async () => {
    const say = vi.fn(); bus.on("say", say);
    await flow.play(A);
    await flow.eject();
    expect(anim.eject3D).toHaveBeenCalledWith("a", expect.anything());
    expect(state.current).toBeNull();
    expect(buttons.setGone).toHaveBeenLastCalledWith("a", false);
    expect(buttons.focus).toHaveBeenCalledWith("a");
    expect(say).toHaveBeenCalled();
  });

  it("boştayken eject ve close hiçbir şey yapmaz", async () => {
    await flow.eject(); await flow.close();
    expect(anim.eject3D).not.toHaveBeenCalled();
    expect(screen.close).not.toHaveBeenCalled();
  });

  it("animasyon hata verse de kilit kalkar", async () => {
    anim.insert3D.mockRejectedValueOnce(new Error("x"));
    await flow.play(A).catch(() => {});
    expect(flow.isBusy()).toBe(false);
  });
});
