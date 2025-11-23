export const m4 = {
  multiply(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 4; ++j) {
        let s = 0;
        for (let k = 0; k < 4; ++k)
          s += a[k * 4 + j] * b[i * 4 + k];
        out[i * 4 + j] = s;
      }
    }
    return out;
  },

  identity() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  },

  translation(tx, ty, tz) {
    const m = this.identity();
    m[12] = tx; m[13] = ty; m[14] = tz;
    return m;
  },

  translate(m, tx, ty, tz) {
    return this.multiply(m, this.translation(tx, ty, tz));
  },

  xRotate(m, r) {
    const c = Math.cos(r), s = Math.sin(r);
    return this.multiply(m, new Float32Array([
      1,0,0,0,
      0,c,s,0,
      0,-s,c,0,
      0,0,0,1
    ]));
  },

  yRotate(m, r) {
    const c = Math.cos(r), s = Math.sin(r);
    return this.multiply(m, new Float32Array([
      c,0,-s,0,
      0,1,0,0,
      s,0,c,0,
      0,0,0,1
    ]));
  },

  perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f/aspect,0,0,0,
      0,f,0,0,
      0,0,(far+near)*nf,-1,
      0,0,2*far*near*nf,0
    ]);
  }
};
