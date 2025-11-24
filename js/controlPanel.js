// js/controlPanel.js
export function controlPanel() {
  const slowBtn = document.getElementById("slowBtn");
  const normalBtn = document.getElementById("normalBtn");
  const fastBtn = document.getElementById("fastBtn");
  const speedButtons = [slowBtn, normalBtn, fastBtn];

  function setSpeed(speed, activeBtn) {
    animationSpeed = speed;  
    speedButtons.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  slowBtn.addEventListener("click", () => setSpeed(0.5, slowBtn));
  normalBtn.addEventListener("click", () => setSpeed(1.0, normalBtn));
  fastBtn.addEventListener("click", () => setSpeed(2.0, fastBtn));

}