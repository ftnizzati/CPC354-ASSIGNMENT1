// js/controlPanel.js
export let animationSpeed = 1.0;   // global shared variable
export let colorF = "#ff0000";
export let colorI = "#00ff00";
export let colorT = "#0000ff";

export function changeColor(color) {
    // Update your WebGL color here
    console.log("Applying color:", color);
}

export function controlPanel() {
// ------- Speed Drop-Down Menu -------------
    const speedSelect = document.getElementById("speedSelect");

    speedSelect.addEventListener("change", (e) => {
        animationSpeed = parseFloat(e.target.value);
        console.log("Speed changed to:", animationSpeed);
    });

// ------- Color Picker Submit Button -------
       // ===== COLOR PICKERS =====
      document.getElementById("colorF").addEventListener("input", e => {
        colorF = e.target.value;
    });

    document.getElementById("colorI").addEventListener("input", e => {
        colorI = e.target.value;
    });

    document.getElementById("colorT").addEventListener("input", e => {
        colorT = e.target.value;
    });

    document.getElementById("speedSelect").addEventListener("change", e => {
        animationSpeed = parseFloat(e.target.value);
    });
}
