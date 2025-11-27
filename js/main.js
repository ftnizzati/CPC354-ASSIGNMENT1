import { vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { m4 } from "./m4.js";
import { buildLetterF, buildLetterI, buildLetterT } from "./geometry.js";
import { controlPanel, animationSpeed, colorF, colorI, colorT, colorMode } from './controlPanel.js';

function createShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:",  gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(gl, vs, fs) {
  const p = gl.createProgram();
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!vertexShader || !fragmentShader) return null;
  gl.attachShader(p, vertexShader);
  gl.attachShader(p, fragmentShader);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

function hexToRgbArray(hex) {
  return [
    parseInt(hex.substring(1,3),16)/255,
    parseInt(hex.substring(3,5),16)/255,
    parseInt(hex.substring(5,7),16)/255,
    1.0
  ];
}

function main(){
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) return alert("WebGL2 required");

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

  const posLoc  = gl.getAttribLocation(program,"a_position");
  const colLoc  = gl.getUniformLocation(program,"u_color");
  const matLoc  = gl.getUniformLocation(program,"u_matrix");
  const modeLoc = gl.getUniformLocation(program,"u_mode");

  // ========== Build Geometry ==========
  const positions=[];
  const depth=40, spacing=40, w=100, h=150;
  const startX=-(w*3+spacing*2)/2, startY=-h/2;

  const beforeF=positions.length;
  buildLetterF(startX,startY,depth,positions);
  const afterF=positions.length;
  const fCount=(afterF-beforeF)/3;

  const beforeI=positions.length;
  buildLetterI(startX+w+spacing,startY,depth,positions);
  const afterI=positions.length;
  const iCount=(afterI-beforeI)/3;

  const beforeT=positions.length;
  buildLetterT(startX+(w+spacing)*2,startY,depth,positions);
  const afterT=positions.length;
  const tCount=(afterT-beforeT)/3;

  const positionBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);

  gl.enable(gl.DEPTH_TEST);

  let rotX=0, rotY=0, dist=600;
  let isAnimating=false, stage=0;
  const speed=Math.PI/2;
  let lastTime=0;

  // Scaling
  let scaleModel=1, scaleFullScreen=1, scaleStart=0;
  const scaleDuration=1.5;
  const fov=Math.PI/4, fl=1/Math.tan(fov/2);
  const targetCoverage=0.9;
  scaleFullScreen=(targetCoverage*2*dist)/(h*fl);

  controlPanel();

  // ============ Animation ==============
  function animate(t){
    if(!isAnimating) return;
    if(!lastTime) lastTime=t;
    const dt=(t-lastTime)/1000;
    lastTime=t;

    // Stage 0: Rotate +180°
    if(stage===0){
      rotY+=speed*animationSpeed*dt;
      if(rotY>=Math.PI){rotY=Math.PI;stage=1;}
    }
    // Stage 1: Return to center
    else if(stage===1){
      rotY-=speed*animationSpeed*dt;
      if(rotY<=0){rotY=0;stage=2;}
    }
    // Stage 2: Rotate -180°
    else if(stage===2){
      rotY-=speed*animationSpeed*dt;
      if(rotY<=-Math.PI){rotY=-Math.PI;stage=3;}
    }
    // Stage 3: Back to center
    else if(stage===3){
      rotY+=speed*animationSpeed*dt;
      if(rotY>=0){rotY=0;stage=4;}
    }
    // Stage 4: Scale to fullscreen
    else if(stage===4){
      if(scaleStart===0) scaleStart=t;
      const p=Math.min((t-scaleStart)/(scaleDuration*1000),1);
      const ease=1-(1-p)**3;
      scaleModel=1+(scaleFullScreen-1)*ease;
      if(p>=1) stage=5;
    }
    // Stage 5: Idle continuous motion
    else if(stage===5){
      rotY+=0.3*animationSpeed*dt;
    }

    draw();
    requestAnimationFrame(animate);
  }

  // ============ BUTTONS ===============
  const animateBtn=document.getElementById("animateBtn");
  animateBtn.addEventListener("click",()=>{
    isAnimating=!isAnimating;
    if(isAnimating){
      animateBtn.textContent="Stop";
      lastTime=0; requestAnimationFrame(animate);
    } else animateBtn.textContent="Animate";
  });

  const resetBtn=document.getElementById("resetBtn");
  resetBtn.addEventListener("click",()=>{
    isAnimating=false;
    animateBtn.textContent="Animate";
    rotX=rotY=0; stage=0;
    scaleModel=1; scaleStart=0; lastTime=0;
    draw();
  });

  // ============ DRAW =============
  function resize(){
    const dpr=window.devicePixelRatio||1;
    const w=canvas.clientWidth*dpr, h2=canvas.clientHeight*dpr;
    if(canvas.width!==w||canvas.height!==h2){
      canvas.width=w;canvas.height=h2;
      gl.viewport(0,0,w,h2);
    }
  }

  function draw(){
    resize();
    gl.clearColor(0.06,0.06,0.06,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    let m=m4.perspective(Math.PI/4,canvas.width/canvas.height,1,4000);
    m=m4.translate(m,0,0,-dist);
    m=m4.xRotate(m,rotX);
    m=m4.yRotate(m,rotY);

    const s=scaleModel;
    m=m4.multiply(m,new Float32Array([
      s,0,0,0,
      0,s,0,0,
      0,0,s,0,
      0,0,0,1
    ]));

    gl.uniformMatrix4fv(matLoc,false,m);
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc,3,gl.FLOAT,false,0,0);

    let modeVal=(colorMode==="solid"?0:colorMode==="gradient"?1:2);
    gl.uniform1i(modeLoc,modeVal);

    if(modeVal===0){
      gl.uniform4fv(colLoc,hexToRgbArray(colorF));
      gl.drawArrays(gl.TRIANGLES,beforeF/3,fCount);
      gl.uniform4fv(colLoc,hexToRgbArray(colorI));
      gl.drawArrays(gl.TRIANGLES,beforeI/3,iCount);
      gl.uniform4fv(colLoc,hexToRgbArray(colorT));
      gl.drawArrays(gl.TRIANGLES,beforeT/3,tCount);
    } else {
      gl.drawArrays(gl.TRIANGLES,0,positions.length/3);
    }
  }

  draw();
  window.addEventListener("resize",draw);
}

main();
