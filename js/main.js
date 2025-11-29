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

function hexToRgbVec3(hex) {    // for gradient
  return new Float32Array([
    parseInt(hex.substring(1, 3), 16) / 255,
    parseInt(hex.substring(3, 5), 16) / 255,
    parseInt(hex.substring(5, 7), 16) / 255
  ]);
}

// ---- function for gradient -------
function darkenHex(hex, factor = 0.4) {
  const r = Math.round(parseInt(hex.substring(1,3),16) * factor);
  const g = Math.round(parseInt(hex.substring(3,5),16) * factor);
  const b = Math.round(parseInt(hex.substring(5,7),16) * factor);
  return [
    r / 255,
    g / 255,
    b / 255,
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

   // gradient uniform locations
  const startColorLoc = gl.getUniformLocation(program, "u_startColor");
  const endColorLoc   = gl.getUniformLocation(program, "u_endColor");

  const u_colorTopLoc    = gl.getUniformLocation(program, "u_colorTop");    
  const u_colorMiddleLoc = gl.getUniformLocation(program, "u_colorMiddle"); 
  const u_colorBottomLoc = gl.getUniformLocation(program, "u_colorBottom"); 

  // >>> add this: uniforms for gradient Y mapping
  const u_gradMinYLoc = gl.getUniformLocation(program, "u_gradMinY");      
  const u_gradHeightLoc = gl.getUniformLocation(program, "u_gradHeight");   

  // added for lighting
  const normalLoc = gl.getAttribLocation(program, "a_normal");            
  const u_lightDirLoc      = gl.getUniformLocation(program, "u_lightDir");      
  const u_lightStrengthLoc = gl.getUniformLocation(program, "u_lightStrength"); 

  // default light setup
  // light coming directly from front
  gl.uniform3fv(u_lightDirLoc, new Float32Array([0, 0, -1])); 
  gl.uniform1f(u_lightStrengthLoc, 1.0);
  let lightOn = false;

  //default background colour
  let bgColor = [0, 0, 0, 1];



  // geometry rebuildable
  let positions = [];
  let beforeF, beforeI, beforeT;
  let afterF, afterI, afterT;
  let fCount, iCount, tCount;
  let currentDepth = 40;

  const positionBuffer = gl.createBuffer();
  const normalBuffer   = gl.createBuffer();

  const spacing = 40, w = 100, h = 150;              
  const startX = -(w * 3 + spacing * 2) / 2;           
  const startY = -h / 2; 

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
    const normals = [];
    currentDepth = depth;

    beforeF = positions.length;
    buildLetterF(startX, startY, depth, positions);
    afterF = positions.length;
    fCount = (afterF - beforeF) / 3;

    beforeI = positions.length;
    buildLetterI(startX + w + spacing, startY, depth, positions);
    afterI = positions.length;
    iCount = (afterI - beforeI) / 3; 

    // ----- T letter -----
    beforeT = positions.length;
    buildLetterT(startX + (w + spacing) * 2, startY, depth, positions);
    afterT = positions.length;
    tCount = (afterT - beforeT) / 3;

    // compute flat normals per triangle
    for (let i = 0; i < positions.length; i += 9) {          
      const ax = positions[i],   ay = positions[i+1], az = positions[i+2];
      const bx = positions[i+3], by = positions[i+4], bz = positions[i+5];
      const cx = positions[i+6], cy = positions[i+7], cz = positions[i+8];

      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const vx = cx - ax, vy = cy - ay, vz = cz - az;

      const nx = uy*vz - uz*vy;
      const ny = uz*vx - ux*vz;
      const nz = ux*vy - uy*vx;

      const len = Math.hypot(nx, ny, nz) || 1;
      const nnx = nx/len, nny = ny/len, nnz = nz/len;

      for (let j = 0; j < 3; j++) normals.push(nnx, nny, nnz);
    }


    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

    // upload normals
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);

     // We map object-space Y (startY..startY+h) -> 0..1
    gl.uniform1f(u_gradMinYLoc, startY);            
    gl.uniform1f(u_gradHeightLoc, h);   

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

        // >>> add this: rotate while scaling
        rotY += Math.PI/4 * animationSpeed * dt;  // rotate around Y
        //rotX += Math.PI/8 * animationSpeed * dt;  // rotate around X
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


  // light button
  const toggleLightBtn = document.getElementById("toggleLightBtn");
  toggleLightBtn.addEventListener("click", () => {
      lightOn = !lightOn;
      gl.uniform1f(u_lightStrengthLoc, lightOn ? 1.0 : 0.0);
      toggleLightBtn.textContent = `Light: ${lightOn ? "ON" : "OFF"}`;
      draw();
  });

  // Background color picker
  const bgColorPicker = document.getElementById("bgColorPicker"); 
  if (bgColorPicker) {                                           
      bgColorPicker.addEventListener("input", (e) => {         
          const hex = e.target.value;                           
          bgColor = [                                           
              parseInt(hex.substring(1,3),16)/255,             
              parseInt(hex.substring(3,5),16)/255,            
              parseInt(hex.substring(5,7),16)/255,           
              1.0                                              
          ];                                                    
          draw();                                               
      });                                                       
  }                   
  
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

    // reset extrusion slider to 1.0
    const extrusionSlider = document.getElementById("extrusionSlider");
    if (extrusionSlider) {
        extrusionSlider.value = 1.0;
        window.updateTextExtrusion(1.0);
    }

    // turn light OFF
    lightOn = false;
    gl.uniform1f(u_lightStrengthLoc, 0.0);
    toggleLightBtn.textContent = "Light: OFF";
    
    // restore default colors
    colorState.colorF = "#ff0000";
    colorState.colorI = "#00ff00";
    colorState.colorT = "#0000ff";
    colorState.colorMode = "solid";

    document.getElementById("colorF").value = colorState.colorF;
    document.getElementById("colorI").value = colorState.colorI;
    document.getElementById("colorT").value = colorState.colorT;
    document.getElementById("colorMode").value = colorState.colorMode;

     document.getElementById("colorPickers").style.display = "block";   // >>> add this

    // restore default speed
    animationSpeed = 1.0;
    document.getElementById("speedSelect").value = "1.0";

    // restore default path
    animationPath = "full";
    document.getElementById("animationPath").value = "full";

    // restore default background
    bgColor = [0, 0, 0, 1];
    if (bgColorPicker) bgColorPicker.value = "#000000";


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
    window.draw = draw;
    resize();
    gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]); 
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

    // bind normals attribute safely (TS-safe)
    if (normalLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    let modeVal = colorState.colorMode === "gradient" ? 1 : colorState.colorMode === "rainbow"  ? 2 : 0;

    gl.uniform1i(modeLoc, modeVal);

    if (modeVal === 0) {
      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorF));
      gl.drawArrays(gl.TRIANGLES, beforeF/3, fCount);

      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorI));
      gl.drawArrays(gl.TRIANGLES, beforeI/3, iCount);

      gl.uniform4fv(colLoc, hexToRgbArray(colorState.colorT));
      gl.drawArrays(gl.TRIANGLES, beforeT/3, tCount);
    }
    else if (modeVal === 1) {
      gl.uniform3fv(u_colorTopLoc,    hexToRgbVec3(colorState.colorT));    
      gl.uniform3fv(u_colorMiddleLoc, hexToRgbVec3(colorState.colorI));    
      gl.uniform3fv(u_colorBottomLoc, hexToRgbVec3(colorState.colorF));    

      // draw all letters (each letter uses the same vertical mapping but its local vertices determine their blend)
      gl.drawArrays(gl.TRIANGLES, Math.floor(beforeF/3), Math.floor(fCount));
      gl.drawArrays(gl.TRIANGLES, Math.floor(beforeI/3), Math.floor(iCount));
      gl.drawArrays(gl.TRIANGLES, Math.floor(beforeT/3), Math.floor(tCount));
    }
    
    else {
      gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
    }
  }

  draw();
  window.addEventListener("resize", draw);
}

main();
