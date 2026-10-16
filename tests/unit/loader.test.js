import { describe, it, expect, vi, afterEach } from "vitest";
import { runLoader } from "../../src/ui/loader.js";

describe("runLoader", () => {
  afterEach(() => vi.useRealTimers());
  const setup = () => {
    document.body.innerHTML = `<div id="l"><b id="b"></b></div>`;
    return { el: document.getElementById("l"), barEl: document.getElementById("b") };
  };
  it("beklenenlerden biri hiç çözülmese bile süre dolunca kapanır", async () => {
    vi.useFakeTimers();
    const { el, barEl } = setup();
    let done = false;
    const p = runLoader({ el, barEl, timeout: 2500, waits: [Promise.resolve(), new Promise(() => {})] }).then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(2400);
    expect(el.classList.contains("out")).toBe(false);
    await vi.advanceTimersByTimeAsync(100 + 500);
    await p;
    expect(done).toBe(true);
    expect(el.hidden).toBe(true);
  });
  it("hepsi çözülünce beklemeden kapanır", async () => {
    vi.useFakeTimers();
    const { el, barEl } = setup();
    const p = runLoader({ el, barEl, timeout: 2500, waits: [Promise.resolve(), Promise.resolve(1)] });
    await vi.advanceTimersByTimeAsync(500);
    await p;
    expect(el.hidden).toBe(true);
  });
  it("reddedilen bekleme yükleme ekranını takılı bırakmaz", async () => {
    vi.useFakeTimers();
    const { el, barEl } = setup();
    const p = runLoader({ el, barEl, timeout: 2500, waits: [Promise.reject(new Error("x"))] });
    await vi.advanceTimersByTimeAsync(500);
    await p;
    expect(el.hidden).toBe(true);
  });
});
