import { vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { m4 } from "./m4.js";
import { buildLetterF, buildLetterI, buildLetterT } from "./geometry.js";

function createShader(gl,type,src){
  const s = gl.createShader(type);
  gl.shaderSource(s,src);
  gl.compileShader(s);
  return s;
}

function createProgram(gl,vs,fs){
  const p = gl.createProgram();
  gl.attachShader(p, createShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, createShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}

function main(){
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) return alert("WebGL2 required");

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

  const posLoc  = gl.getAttribLocation(program, "a_position");
  const colLoc  = gl.getAttribLocation(program, "a_color");
  const matLoc  = gl.getUniformLocation(program, "u_matrix");

  // === Geometry ===
  const positions=[], colors=[];
  const depth=40, spacing=40, w=100, h=150;
  const startX = -(w*3 + spacing*2)/2;
  const startY = -h/2;

  buildLetterF(startX, startY, depth, positions, colors);
  buildLetterI(startX+w+spacing, startY, depth, positions, colors);
  buildLetterT(startX+(w+spacing)*2, startY, depth, positions, colors);

  // solid buffers
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), gl.STATIC_DRAW);

  gl.enable(gl.DEPTH_TEST);

  let rotX=0, rotY=0, dist=600;

  let isAnimating = false;   // track if animation is running
  let stage = 0;  // 0: +180, 1: back to 0, 2: -180, 3: back to 0
  const speed = Math.PI; // 180° per second

  let lastTime = 0;

  function animate(t) {
    if (!isAnimating) return;

    if (!lastTime) lastTime = t;
    const dt = (t - lastTime) / 1000;
    lastTime = t;

    // ---- STAGE 0: 0 → +180 ----
    if (stage === 0) {
      rotY += speed * dt;
      if (rotY >= Math.PI) {
        rotY = Math.PI;
        stage = 1;
      }
    }

    // ---- STAGE 1: +180 → 0 ----
    else if (stage === 1) {
      rotY -= speed * dt;
      if (rotY <= 0) {
        rotY = 0;
        stage = 2;
      }
    }

    // ---- STAGE 2: 0 → -180 ----
    else if (stage === 2) {
      rotY -= speed * dt;
      if (rotY <= -Math.PI) {
        rotY = -Math.PI;
        stage = 3;
      }
    }

    // ---- STAGE 3: -180 → 0 ----
    else if (stage === 3) {
      rotY += speed * dt;
      if (rotY >= 0) {
        rotY = 0;
        stage = 4;
      }
    }

    // ---- DONE ----
    else if (stage === 4) {
      isAnimating = false;
      btn.textContent = "Animate";
      draw();
      return;
    }

    draw();
    requestAnimationFrame(animate);
  }

  const btn = document.getElementById("animateBtn");
      btn.addEventListener("click", () => {
        if (!isAnimating) {
          if (stage === 4) {
            stage = 0;
            rotY = 0;
          }
          lastTime = 0;  // always reset timer
        }
        isAnimating = !isAnimating;  // toggle start/stop
        if (isAnimating) {
        lastTime = 0;               // reset timer
        requestAnimationFrame(animate);
        btn.textContent = "Stop";   // update button text
        } else {
        btn.textContent = "Animate";
        }
  });



  function resize(){
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h){
      canvas.width = w; canvas.height = h;
      gl.viewport(0,0,w,h);
    }
  }

  function draw(){
    resize();
    gl.clearColor(0.06,0.06,0.06,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let m = m4.perspective(Math.PI/4, canvas.width/canvas.height, 1, 4000);
    m = m4.translate(m,0,0,-dist);
    m = m4.xRotate(m,rotX);
    m = m4.yRotate(m,rotY);

    gl.uniformMatrix4fv(matLoc, false, m);

    // solid
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colLoc);
    gl.vertexAttribPointer(colLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

    gl.drawArrays(gl.TRIANGLES,0,positions.length/3);
  }

  draw();
  window.addEventListener("resize", draw);
}

main();