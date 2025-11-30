// A small 4×4 matrix math helper library for WebGL
export const m4 = {
  // Multiply two 4×4 matrices (a × b)
  // Stored in column-major order
  multiply(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; ++i) {           // row of result
      for (let j = 0; j < 4; ++j) {         // column of result
        let s = 0;
        for (let k = 0; k < 4; ++k)         // dot product of row i and column j
          s += a[k * 4 + j] * b[i * 4 + k];
        out[i * 4 + j] = s;
      }
    }
    return out;
  },

  // Return a standard 4×4 identity matrix
  identity() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  },

  // Create a translation matrix (tx, ty, tz)
  translation(tx, ty, tz) {
    const m = this.identity();
    m[12] = tx; m[13] = ty; m[14] = tz;
    return m;
  },

  // Multiply an existing matrix with a translation
  translate(m, tx, ty, tz) {
    return this.multiply(m, this.translation(tx, ty, tz));
  },

  // Rotate around X-axis by r radians and apply to matrix m
  xRotate(m, r) {
    const c = Math.cos(r), s = Math.sin(r);

    // Standard X-rotation matrix
    return this.multiply(m, new Float32Array([
      1,0,0,0,
      0,c,s,0,
      0,-s,c,0,
      0,0,0,1
    ]));
  },

  // Rotate around Y-axis by r radians and apply to matrix m
  yRotate(m, r) {
    const c = Math.cos(r), s = Math.sin(r);
    
    // Standard Y-rotation matrix
    return this.multiply(m, new Float32Array([
      c,0,-s,0,
      0,1,0,0,
      s,0,c,0,
      0,0,0,1
    ]));
  },

  // Create a perspective projection matrix
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
