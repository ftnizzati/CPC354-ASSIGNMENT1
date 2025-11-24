// js/controlPanel.js

export let animationSpeed = 1.0;   // global shared variable

export function controlPanel() {
    const speedSelect = document.getElementById("speedSelect");

    speedSelect.addEventListener("change", (e) => {
        animationSpeed = parseFloat(e.target.value);
        console.log("Speed changed to:", animationSpeed);
    });
}
