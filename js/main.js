import { vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { m4 } from "./m4.js";
import { buildLetterF, buildLetterI, buildLetterT } from "./geometry.js";
import { controlPanel, animationSpeed as panelSpeed, colorState } from './controlPanel.js';

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
  const v = createShader(gl, gl.VERTEX_SHADER, vs);
  const f = createShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;

  gl.attachShader(p, v);
  gl.attachShader(p, f);
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

  // program
  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

  const posLoc  = gl.getAttribLocation(program, "a_position");
  const colLoc  = gl.getUniformLocation(program, "u_color");
  const matLoc  = gl.getUniformLocation(program, "u_matrix");
  const modeLoc = gl.getUniformLocation(program, "u_mode");

  // geometry rebuildable
  let positions = [];
  let beforeF, beforeI, beforeT;
  let fCount, iCount, tCount;
  let currentDepth = 40;

  const positionBuffer = gl.createBuffer();

   let rotX = 0, rotY = 0;
  let dist = 600;

  let scaleModel = 1;
  let scaleFullScreen = 1;
  let scaleStart = 0;

  let isAnimating = false;
  let stage = 0;
  let lastTime = 0;

  // speed from control panel
  let animationSpeed = panelSpeed;

  let animationPath = "full";

  // FOV for scaling
  const fov = Math.PI / 4;
  const fl = 1 / Math.tan(fov / 2);
  const targetCoverage = 0.9;
  scaleFullScreen = (targetCoverage * 2 * dist) / (150 * fl);

  function rebuildGeometry(depth) {
    positions = [];
    currentDepth = depth;

    const spacing = 40, w = 100, h = 150;
    const startX = -(w * 3 + spacing * 2) / 2;
    const startY = -h / 2;

    beforeF = positions.length;
    buildLetterF(startX, startY, depth, positions);
    fCount = (positions.length - beforeF) / 3;

    beforeI = positions.length;
    buildLetterI(startX + w + spacing, startY, depth, positions);
    iCount = (positions.length - beforeI) / 3;

    beforeT = positions.length;
    buildLetterT(startX + (w + spacing) * 2, startY, depth, positions);
    tCount = (positions.length - beforeT) / 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

    draw();
  }

  // INITIAL BUILD
  rebuildGeometry(40);

  // update from extrusion slider
  window.updateTextExtrusion = function(value) {
    rebuildGeometry(value * 40);
  };

  gl.enable(gl.DEPTH_TEST);


  // CONTROL PANEL SETUP
  controlPanel();

  // path selector
  document.getElementById("animationPath").addEventListener("change", e => {
    animationPath = e.target.value;

    // reset animation behavior
    rotY = 0;
    stage = 0;
    scaleModel = 1;
    scaleStart = 0;
    lastTime = 0;
    draw();
  });

  // speed dropdown
  document.getElementById("speedSelect").addEventListener("change", e => {
    animationSpeed = parseFloat(e.target.value);
  });

  // MAIN ANIMATION LOOP
  function animate(t) {
    if (!isAnimating) return;

    if (!lastTime) lastTime = t;
    const dt = (t - lastTime) / 1000;
    lastTime = t;

    // PATH MODE LOGIC
    switch (animationPath) {

      case "rotate":
        rotY += Math.PI/2 * animationSpeed * dt;
        break;

      case "scale":
        if (scaleStart === 0) scaleStart = t;
        const p1 = Math.min((t - scaleStart) / (1.5 * 1000), 1);
        const e1 = 1 - Math.pow(1 - p1, 3);
        scaleModel = 1 + (scaleFullScreen - 1) * e1;
        break;

      case "bounce":
        rotY = Math.sin(t * 0.002 * animationSpeed) * 1.5;
        scaleModel = 1 + Math.sin(t * 0.003 * animationSpeed) * 0.15;
        break;

      case "full":
      default:
        // ---- Stage-based animation ----
        const speed = Math.PI / 2;

        if (stage === 0) {
          rotY += speed * animationSpeed * dt;
          if (rotY >= Math.PI) { rotY = Math.PI; stage = 1; }
        }
        else if (stage === 1) {
          rotY -= speed * animationSpeed * dt;
          if (rotY <= 0) { rotY = 0; stage = 2; }
        }
        else if (stage === 2) {
          rotY -= speed * animationSpeed * dt;
          if (rotY <= -Math.PI) { rotY = -Math.PI; stage = 3; }
        }
        else if (stage === 3) {
          rotY += speed * animationSpeed * dt;
          if (rotY >= 0) { rotY = 0; stage = 4; }
        }
        else if (stage === 4) {
          if (scaleStart === 0) scaleStart = t;
          const p2 = Math.min((t - scaleStart) / (1.5 * 1000), 1);
          const e2 = 1 - Math.pow(1 - p2, 3);
          scaleModel = 1 + (scaleFullScreen - 1) * e2;
          if (p2 >= 1) stage = 5;
        }
        else if (stage === 5) {
          rotY += 0.3 * animationSpeed * dt;
        }
        break;
    }

    draw();
    requestAnimationFrame(animate);
  }

  // BUTTONS
  const animateBtn = document.getElementById("animateBtn");
  animateBtn.addEventListener("click", () => {
    isAnimating = !isAnimating;

    if (isAnimating) {
      animateBtn.textContent = "Stop";
      lastTime = 0;
      requestAnimationFrame(animate);
    } else {
      animateBtn.textContent = "Animate";
    }
  });

  const resetBtn = document.getElementById("resetBtn");
  resetBtn.addEventListener("click", () => {
    isAnimating = false;
    animateBtn.textContent = "Animate";

    rotX = 0;
    rotY = 0;
    stage = 0;
    scaleModel = 1;
    scaleStart = 0;
    lastTime = 0;

    // restore default colors
    colorState.colorF = "#ff0000";
    colorState.colorI = "#00ff00";
    colorState.colorT = "#0000ff";
    colorState.colorMode = "solid";

    document.getElementById("colorF").value = colorState.colorF;
    document.getElementById("colorI").value = colorState.colorI;
    document.getElementById("colorT").value = colorState.colorT;
    document.getElementById("colorMode").value = colorState.colorMode;

    // restore default speed
    animationSpeed = 1.0;
    document.getElementById("speedSelect").value = "1.0";

    // restore default path
    animationPath = "full";
    document.getElementById("animationPath").value = "full";

    draw();
  });

  // DRAW
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0,0,w,h);
    }
  }

  function draw() {
    resize();
    gl.clearColor(0.06, 0.06, 0.06, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let m = m4.perspective(fov, canvas.width / canvas.height, 1, 4000);
    m = m4.translate(m, 0, 0, -dist);
    m = m4.xRotate(m, rotX);
    m = m4.yRotate(m, rotY);

    // scaling
    const s = scaleModel;
    m = m4.multiply(m, new Float32Array([
      s,0,0,0,
      0,s,0,0,
      0,0,s,0,
      0,0,0,1
    ]));

    gl.uniformMatrix4fv(matLoc, false, m);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    let modeVal = colorState.colorMode === "gradient" ? 1 :
                  colorState.colorMode === "rainbow"  ? 2 : 0;

    gl.uniform1i(modeLoc, modeVal);

    if (modeVal === 0) {
      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorF));
      gl.drawArrays(gl.TRIANGLES, beforeF/3, fCount);

      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorI));
      gl.drawArrays(gl.TRIANGLES, beforeI/3, iCount);

      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorT));
      gl.drawArrays(gl.TRIANGLES, beforeT/3, tCount);
    }
    else {
      gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
    }
  }

  draw();
  window.addEventListener("resize", draw);
}

main();
