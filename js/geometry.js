// Build a rectangular 3D box with width w, height h and depth d
// Adds ONLY positions — color is no longer baked in.
export function buildBox(x, y, w, h, d, pos) {
  const zf = -d / 2;   // front Z
  const zb =  d / 2;   // back Z

  // 6 faces, 2 triangles each → 12 triangles → 36 vertices
  const faces = [
    // Front
    [x,y,zf,   x,y+h,zf,   x+w,y,zf,   x,y+h,zf,   x+w,y+h,zf,   x+w,y,zf],

    // Back
    [x,y,zb,   x+w,y,zb,   x,y+h,zb,   x,y+h,zb,   x+w,y,zb,     x+w,y+h,zb],

    // Top
    [x,y,zf,   x+w,y,zf,   x+w,y,zb,   x,y,zf,     x+w,y,zb,     x,y,zb],

    // Bottom
    [x,y+h,zf, x,y+h,zb,   x+w,y+h,zb, x,y+h,zf,   x+w,y+h,zb,   x+w,y+h,zf],

    // Left
    [x,y,zf,   x,y,zb,     x,y+h,zb,   x,y,zf,     x,y+h,zb,     x,y+h,zf],

    // Right
    [x+w,y,zf, x+w,y+h,zf, x+w,y+h,zb, x+w,y,zf,   x+w,y+h,zb,   x+w,y,zb],
  ];

  // Push positions (webgl y-axis inverted → -y)
  for (const f of faces) {
    for (let i = 0; i < f.length; i += 3) {
      const px = f[i];
      const py = f[i + 1];
      const pz = f[i + 2];
      pos.push(px, -py, pz);  // <-- Y flipped
    }
  }
}

// ========== LETTER SHAPES ==========

// Letter F
export function buildLetterF(x, y, d, pos) {
  const t = 30, w = 100, h = 150;

  // Vertical bar
  buildBox(x, y, t, h, d, pos);

  // Top horizontal
  buildBox(x + t, y, w - t, t, d, pos);

  // Middle horizontal
  buildBox(x + t, y + t*2, (w * 2/3) - t, t, d, pos);
}

// Letter I
export function buildLetterI(x, y, d, pos) {
  const w = 100, h = 150, t = 30;

  // Top bar
  buildBox(x, y, w, t, d, pos);

  // Bottom bar
  buildBox(x, y + h - t, w, t, d, pos);

  // Middle vertical stem
  buildBox(x + w/2 - t/2, y + t, t, h - t*2, d, pos);
}

// Letter T
export function buildLetterT(x, y, d, pos) {
  const w = 100, h = 150, t = 30;

  // Top horizontal
  buildBox(x, y, w, t, d, pos);

  // Middle vertical
  buildBox(x + w/2 - t/2, y + t, t, h - t, d, pos);
}

