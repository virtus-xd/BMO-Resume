export const SLICES = ["morning", "noon", "sunset", "night"];

export function sliceForHour(h) {
  if (h >= 6 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "noon";
  if (h >= 17 && h < 20) return "sunset";
  return "night";
}

export function nextSlice(s) {
  return SLICES[(SLICES.indexOf(s) + 1) % SLICES.length];
}

export function applySlice(root, slice) {
  SLICES.forEach((s) => root.classList.toggle("t-" + s, s === slice));
}
