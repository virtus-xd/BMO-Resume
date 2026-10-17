/* Ucuz ön kontrol: tarayıcı WebGL'i hiç tanımıyorsa three.js indirilmez. Deneme bağlamı yaratmak (gerçek GPU'da
   ~150 ms) yerine asıl bağlamı three.js kurar; kurulamazsa fırlatır ve yedek (Liste) devreye girer. */
export function hasWebGL(win = window) {
  return "WebGLRenderingContext" in win;
}
