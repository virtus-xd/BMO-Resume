import { BackSide, Color, DataTexture, Mesh, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat } from "three";

export const INK = 0x2b1a12;

/* çizgi film gölgelendirme: 3 basamaklı ışık */
let gradient = null;
function gradientMap() {
  if (gradient) return gradient;
  gradient = new DataTexture(new Uint8Array([90, 170, 255]), 3, 1, RedFormat);
  gradient.minFilter = gradient.magFilter = NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

export function toonMaterial(color, opts = {}) {
  return new MeshToonMaterial({ color, gradientMap: gradientMap(), ...opts });
}

/* mürekkep kontur: normal boyunca itilmiş, yalnız arka yüzü çizilen kabuk */
const outlines = new Map();
function outlineMaterial(t) {
  const key = t.toFixed(4);
  if (!outlines.has(key)) {
    const m = new MeshBasicMaterial({ color: INK, side: BackSide });
    m.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader.replace("#include <begin_vertex>", `vec3 transformed = position + normal * ${key};`);
    };
    m.customProgramCacheKey = () => "outline" + key;
    outlines.set(key, m);
  }
  return outlines.get(key);
}

export function withOutline(mesh, thickness = 0.018) {
  const o = new Mesh(mesh.geometry, outlineMaterial(thickness));
  o.name = "outline";
  o.raycast = () => {};
  mesh.add(o);
  return mesh;
}

/* kenar ışığı (rim): bakış açısına dik kenarlarda ince parlama */
export function rimLight(material, color, strength) {
  const rim = { color: new Color(color), strength };
  material.userData.rim = rim;
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (s, r) => {
    prev?.call(material, s, r);
    s.uniforms.rimColor = { value: rim.color };
    s.uniforms.rimStrength = { value: rim.strength };
    s.fragmentShader = "uniform vec3 rimColor;\nuniform float rimStrength;\n" + s.fragmentShader.replace(
      "#include <tonemapping_fragment>",
      `float rimF = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 3.0);
      gl_FragColor.rgb += rimColor * rimF * rimStrength;
      #include <tonemapping_fragment>`,
    );
  };
  material.customProgramCacheKey = () => "rim";
  return material;
}
