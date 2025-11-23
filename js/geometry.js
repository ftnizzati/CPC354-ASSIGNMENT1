// Build a rectangular box with width w, height h and depth d
export function buildBox(x, y, w, h, d, pos, col, c) {
  const zf = -d / 2, zb = d / 2;

  const faces = [
    [x,y,zf, x,y+h,zf, x+w,y,zf, x,y+h,zf, x+w,y+h,zf, x+w,y,zf],
    [x,y,zb, x+w,y,zb, x,y+h,zb, x,y+h,zb, x+w,y,zb, x+w,y+h,zb],
    [x,y,zf, x+w,y,zf, x+w,y,zb, x,y,zf, x+w,y,zb, x,y,zb],
    [x,y+h,zf, x,y+h,zb, x+w,y+h,zb, x,y+h,zf, x+w,y+h,zb, x+w,y+h,zf],
    [x,y,zf, x,y,zb, x,y+h,zb, x,y,zf, x,y+h,zb, x,y+h,zf],
    [x+w,y,zf, x+w,y+h,zf, x+w,y+h,zb, x+w,y,zf, x+w,y+h,zb, x+w,y,zb],
  ];

  for (const f of faces) {
  for (let i = 0; i < f.length; i += 3) {
    const x = f[i];
    const y = f[i + 1];
    const z = f[i + 2];
    pos.push(x, -y, z);  // Flip Y
  }
}
for (let i = 0; i < 36; i++) col.push(...c);

}

export function buildLetterF(x, y, d, pos, col) {
  const t = 30, w = 100, h = 150, c = [200,70,120,255];
  buildBox(x, y, t, h, d, pos, col, c);
  buildBox(x+t, y, w-t, t, d, pos, col, c);
  buildBox(x+t, y+t*2, (w*2/3)-t, t, d, pos, col, c);
}

export function buildLetterI(x, y, d, pos, col) {
  const w=100, h=150, t=30, c=[250,200,80,255];
  buildBox(x, y, w, t, d, pos, col, c);
  buildBox(x, y+h-t, w, t, d, pos, col, c);
  buildBox(x+w/2-t/2, y+t, t, h-t*2, d, pos, col, c);
}

export function buildLetterT(x, y, d, pos, col) {
  const w=100, h=150, t=30, c=[220,80,120,255];
  buildBox(x, y, w, t, d, pos, col, c);
  buildBox(x+w/2-t/2, y+t, t, h-t, d, pos, col, c);
}
