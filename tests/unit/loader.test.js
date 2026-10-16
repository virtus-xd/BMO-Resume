import { describe, it, expect, vi, afterEach } from "vitest";
import { runLoader } from "../../src/ui/loader.js";

describe("runLoader", () => {
  afterEach(() => vi.useRealTimers());
  it("hazır sinyali hiç gelmezse süre dolunca yine kapanır", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="l"><b id="b"></b></div>`;
    const el = document.getElementById("l");
    const p = runLoader({ el, barEl: document.getElementById("b"), timeout: 2500, ready: new Promise(() => {}) });
    await vi.advanceTimersByTimeAsync(2500 + 500);
    await p;
    expect(el.hidden).toBe(true);
  });
  it("hazır sinyali gelince beklemeden kapanır", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="l"><b id="b"></b></div>`;
    const el = document.getElementById("l");
    const p = runLoader({ el, barEl: document.getElementById("b"), timeout: 2500, ready: Promise.resolve() });
    await vi.advanceTimersByTimeAsync(500);
    await p;
    expect(el.hidden).toBe(true);
  });
});
