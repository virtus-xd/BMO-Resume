import { describe, it, expect, vi, beforeEach } from "vitest";
import { flyToTray } from "../../src/ui/trayFly.js";

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });

describe("flyToTray (telefonda rafa dönüş)", () => {
  let tray, button, thumb;
  beforeEach(() => {
    document.body.innerHTML = `<div class="tray" id="tray"><button class="tape" data-id="a"><img class="thumb" src="data:image/png;base64,AA=="></button></div>`;
    tray = document.getElementById("tray"); button = tray.querySelector(".tape"); thumb = button.querySelector(".thumb");
    tray.getBoundingClientRect = () => rect(0, 732, 390, 112);
    button.getBoundingClientRect = thumb.getBoundingClientRect = () => rect(140, 750, 104, 71);
  });

  it("küçük resmin bir kopyası 3D kasetin yerinden raftaki yerine uçar, inince kaybolur", async () => {
    const onLand = vi.fn(), seen = [];
    const done = flyToTray(button, rect(120, 300, 160, 110), { duration: 0.05, onLand });
    const fly = document.querySelector(".tape-fly");
    expect(fly.getAttribute("src")).toBe(thumb.getAttribute("src"));
    expect(fly.getAttribute("aria-hidden")).toBe("true");
    seen.push(parseFloat(fly.style.top));
    await done;
    expect(document.querySelector(".tape-fly")).toBeNull();
    expect(onLand).toHaveBeenCalledTimes(1);
    expect(seen[0]).toBeCloseTo(300, 0);
  });

  it("son karede kopya tam raftaki küçük resmin üstünde", async () => {
    let last = null;
    const done = flyToTray(button, rect(120, 300, 160, 110), { duration: 0.05, onLand: () => {
      const f = document.querySelector(".tape-fly");
      last = f && { left: parseFloat(f.style.left), top: parseFloat(f.style.top), width: parseFloat(f.style.width) };
    } });
    await done;
    expect(last).toEqual({ left: 140, top: 750, width: 104 });
  });

  it("raftaki yeri görünmüyorsa raf o yere kayar", async () => {
    tray.scrollTo = vi.fn();
    Object.defineProperty(button, "offsetLeft", { value: 600 });
    Object.defineProperty(button, "offsetWidth", { value: 104 });
    Object.defineProperty(tray, "clientWidth", { value: 390 });
    button.getBoundingClientRect = thumb.getBoundingClientRect = () => rect(600, 750, 104, 71);
    await flyToTray(button, rect(120, 300, 160, 110), { duration: 0.02 });
    expect(tray.scrollTo).toHaveBeenCalledWith({ left: 600 + 52 - 195, behavior: "smooth" });
  });

  it("yeri zaten görünüyorsa raf kaymaz", async () => {
    tray.scrollTo = vi.fn();
    await flyToTray(button, rect(120, 300, 160, 110), { duration: 0.02 });
    expect(tray.scrollTo).not.toHaveBeenCalled();
  });

  it("küçük resim henüz yoksa uçuş atlanır ama kaset yine yerine oturur", async () => {
    thumb.removeAttribute("src");
    const onLand = vi.fn();
    await flyToTray(button, rect(120, 300, 160, 110), { duration: 0.05, onLand });
    expect(document.querySelector(".tape-fly")).toBeNull();
    expect(onLand).toHaveBeenCalledTimes(1);
  });
});
