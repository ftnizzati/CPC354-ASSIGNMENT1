// js/controlPanel.js
export let animationSpeed = 1.0;   // global shared variable
export let colorF = "#ff0000";
export let colorI = "#00ff00";
export let colorT = "#0000ff";
export let colorMode = "solid";
export let extrusion = 1.0; // added for 3D text thickness

export function changeColor(color) {
    // Update your WebGL color here
    console.log("Applying color:", color);
}

export function updateExtrusion(value) {
    // Connect this to your 3D scene logic
    console.log("Updating extrusion in real-time:", value);
    // Example: my3DLogo.setExtrusion(value);
}

export function controlPanel() {
    // ------- Speed Drop-Down Menu -------------
    const speedSelect = document.getElementById("speedSelect");

    // ------- Color Pickers -------
    document.getElementById("colorF").addEventListener("input", e => colorF = e.target.value);
    document.getElementById("colorI").addEventListener("input", e => colorI = e.target.value);
    document.getElementById("colorT").addEventListener("input", e => colorT = e.target.value);

    document.getElementById("colorMode").addEventListener("change", e => colorMode = e.target.value);

    // ------- Extrusion Slider -------
    const extrusionSlider = document.getElementById("extrusionSlider");
    if (extrusionSlider) {
        // Create live display for extrusion value
        let extrusionDisplay = document.createElement("span");
        extrusionDisplay.id = "extrusionValueDisplay";
        extrusionDisplay.style.marginLeft = "10px";
        extrusionDisplay.textContent = extrusion; // initial value
        extrusionSlider.parentNode.insertBefore(extrusionDisplay, extrusionSlider.nextSibling);

        extrusionSlider.addEventListener("input", e => {
            extrusion = parseFloat(e.target.value);
            extrusionDisplay.textContent = extrusion.toFixed(1);
            updateExtrusion(extrusion); // update WebGL 3D text live
            console.log("Extrusion live update:", extrusion);
        });
    }

    // ------- Animation Speed Live Display -------
    if (speedSelect) {
        // Create live display for speed
        let speedDisplay = document.createElement("span");
        speedDisplay.id = "speedValueDisplay";
        speedDisplay.style.marginLeft = "10px";
        speedDisplay.textContent = animationSpeed.toFixed(1) + "x"; // initial value
        speedSelect.parentNode.insertBefore(speedDisplay, speedSelect.nextSibling);

        speedSelect.addEventListener("change", e => {
            animationSpeed = parseFloat(e.target.value);
            speedDisplay.textContent = animationSpeed.toFixed(1) + "x";
            // Call your animation speed update function if available
            // Example: updateSpeed(animationSpeed);
            console.log("Animation speed live update:", animationSpeed);
        });
    }
}
 
