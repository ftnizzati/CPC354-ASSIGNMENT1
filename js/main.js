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

  // Geometry 
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
  const speed = Math.PI/2; // rotation speed in radians/sec

  let lastTime = 0;

  //scaling
  let scaleModel = 1;
  let scaleFullScreen = 1; //full screen scale
  let scaleStart = 0; // starting time for scaling
  const scaleDuration = 1.5; //in seconds

  const fov = (Math.PI/4); //field of view, make camera see 45 degree vertically
  const fl = 1/Math.tan(fov/2); // focal length, convert between object size and screen size at given distance
  const objectHeight = h; //height of object
  const targetCoverage = 0.9; //desired coverage for scaling, about 90%
  scaleFullScreen = (targetCoverage*2*dist)/(objectHeight*fl);//scale needed when height is 90% at distance dist.

  //Animation function
  function animate(t) {
    if (!isAnimating) return; //stop animation if flag is false

    if (!lastTime) lastTime = t;
    const dt = (t - lastTime) / 1000; //delta time in secs
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
    // ---- STAGE 4: Scale to Full Screen ----
    else if (stage === 4){
      if (scaleStart === 0) scaleStart = t;

      const progress = Math.min((t-scaleStart)/(scaleDuration*1000),1); //see how long we have been in stage 4 in miliseconds, progress goes from 0 to 1 over time

      const ease = 1 - Math.pow(1-progress,3); //ease out cubic, makes linear motion look smoother
      scaleModel = 1 + (scaleFullScreen - 1) * ease;//scale interpolation, when ease is 0, scale is 1. When ease is 1, scale becomes full screen.

      if (progress >= 1){
        stage = 5; //move to continuous rotation
      }
    }

    else if (stage === 5){
      rotY += (0.3 * dt); // for every frame, rotate little by little based on how much time has passed.
      // rotY is rotation angle around y-axis, dt is time since last frame and 0.3 is rotation speed.
    }

    draw(); //render scene
    requestAnimationFrame(animate); //next frame
  }

  const animateBtn = document.getElementById("animateBtn");
      animateBtn.addEventListener("click", () => {
        if (!isAnimating) {
            stage = 0;
            rotY = 0;
            scaleModel = 1;
            scaleStart = 0;
            lastTime = 0;  // reset animation if stopped
        }

        isAnimating = !isAnimating;  // toggle start/stop

        if (isAnimating) {
        animateBtn.textContent = "Stop";   // update button text
        requestAnimationFrame(animate);
        } else {
        animateBtn.textContent = "Animate"; //reset button label
        }
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

    //scaling
    const s = scaleModel;
    m = m4.multiply(m, new Float32Array([
      s,0,0,0,
      0,s,0,0,
      0,0,s,0,
      0,0,0,1
    ])); //apply uniform scaling. x,y,z are scaled by s

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