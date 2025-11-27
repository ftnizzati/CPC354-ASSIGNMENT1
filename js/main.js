import { vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { m4 } from "./m4.js";
import { buildLetterF, buildLetterI, buildLetterT } from "./geometry.js";
import { controlPanel, animationSpeed as newSpeed, colorState } from './controlPanel.js';

function createShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(gl, vs, fs) {
  const p = gl.createProgram();
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!vertexShader || !fragmentShader) {
    console.error("Failed to create shaders");
    return null;
  }
  gl.attachShader(p, vertexShader);
  gl.attachShader(p, fragmentShader);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function hexToRgbArray(hex) {
  return [
    parseInt(hex.substring(1, 3), 16) / 255,
    parseInt(hex.substring(3, 5), 16) / 255,
    parseInt(hex.substring(5, 7), 16) / 255,
    1.0
  ];
}

function main() {
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) return alert("WebGL2 required");

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

  const posLoc  = gl.getAttribLocation(program, "a_position");
  const colLoc  = gl.getUniformLocation(program, "u_color");
  const matLoc  = gl.getUniformLocation(program, "u_matrix");
  const modeLoc = gl.getUniformLocation(program, "u_mode");

  // Geometry setup
  let positions = [];
  const depth = 40, spacing = 40, w = 100, h = 150;
  const startX = -(w*3 + spacing*2)/2;
  const startY = -h/2;

  const beforeF = positions.length;
  buildLetterF(startX, startY, depth, positions);
  const afterF = positions.length;
  const fCount = (afterF - beforeF) / 3;

  const beforeI = positions.length;
  buildLetterI(startX + w + spacing, startY, depth, positions);
  const afterI = positions.length;
  const iCount = (afterI - beforeI) / 3;

  const beforeT = positions.length;
  buildLetterT(startX + (w + spacing) * 2, startY, depth, positions);
  const afterT = positions.length;
  const tCount = (afterT - beforeT) / 3;

  // solid buffers
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.enable(gl.DEPTH_TEST);

  let rotX=0, rotY=0, dist=600;
  let isAnimating = false;
  let stage = 0;
  let speed = Math.PI/2;
  let lastTime = 0;

  // scaling
  let scaleModel = 1;
  let scaleFullScreen = 1;
  let scaleStart = 0;
  const scaleDuration = 1.5;
  let animationPath = "full";
  let animationSpeed = newSpeed;

  document.getElementById("animationPath").addEventListener("change", (e) => {
    animationPath = e.target.value;
    stage = 0; rotY = 0; scaleModel = 1; scaleStart = 0; lastTime = 0;
    draw();
  });
  const resetBtn = document.getElementById("resetBtn");
      resetBtn.addEventListener("click", () => {
        isAnimating = false; //stop animation
        animateBtn.textContent = "Animate"; //reset button label
        
        rotX = 0;
        rotY = 0;
        stage = 0;
        scaleModel = 1;
        scaleStart = 0;
        lastTime = 0; 
        
        draw(); //redraw letters at initial state
      });


  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0,0,w,h);
    }
  }

  function draw() {
    resize();
    gl.clearColor(0.06,0.06,0.06,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    let m = m4.perspective(Math.PI/4, canvas.width/canvas.height, 1, 4000);
    m = m4.translate(m,0,0,-dist);
    m = m4.xRotate(m,rotX);
    m = m4.yRotate(m,rotY);

    const s = scaleModel;
    m = m4.multiply(m, new Float32Array([ s,0,0,0, 0,s,0,0, 0,0,s,0, 0,0,0,1 ]));

    gl.uniformMatrix4fv(matLoc, false, m);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    let modeVal = colorState.colorMode === "gradient" ? 1 :
                  colorState.colorMode === "rainbow" ? 2 : 0;
    gl.uniform1i(modeLoc, modeVal);

    if (modeVal === 0) {
      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorF));
      gl.drawArrays(gl.TRIANGLES, Math.floor(beforeF/3), Math.floor(fCount));
      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorI));
      gl.drawArrays(gl.TRIANGLES, Math.floor(beforeI/3), Math.floor(iCount));
      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorT));
      gl.drawArrays(gl.TRIANGLES, Math.floor(beforeT/3), Math.floor(tCount));
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, positions.length/3);
    }
  }

  draw();
  window.addEventListener("resize", draw);

}

main();

