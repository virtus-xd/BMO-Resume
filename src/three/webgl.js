/* three.js'i yüklemeden WebGL desteğini sınar (yoksa sahne kurulmaz, Liste açılır) */
export function hasWebGL(doc = document) {
  try {
    const c = doc.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
