// js/controlPanel.js
export let animationSpeed = 1.0;   // global shared variable
export let colorState = {
  colorF: "#ff0000",
  colorI: "#00ff00",
  colorT: "#0000ff",
  colorMode: "solid"
};
export let extrusion = 1.0; // added for 3D text thickness

export function updateExtrusion(value) {
    extrusion = value;

    if (typeof window.updateTextExtrusion === "function") {
        window.updateTextExtrusion(value);
    }
}

//export function changeColor(color) {
//}


export function controlPanel() {
    // ------- Speed Drop-Down Menu -------------
    const speedSelect = document.getElementById("speedSelect");

    // ------- Color Pickers -------
    document.getElementById("colorF").addEventListener("input", e => colorState.colorF = e.target.value);
    document.getElementById("colorI").addEventListener("input", e => colorState.colorI = e.target.value);
    document.getElementById("colorT").addEventListener("input", e => colorState.colorT = e.target.value);

    // ------ Adding More Color Mode ---------
    document.getElementById("colorMode").addEventListener("change", e => colorState.colorMode = e.target.value);

    // ------- Extrusion Slider -------
     const extrusionSlider = document.getElementById("extrusionSlider");

    if (extrusionSlider) {

        let extrusionDisplay = document.createElement("span");
        extrusionDisplay.id = "extrusionValueDisplay";
        extrusionDisplay.style.marginLeft = "10px";
        extrusionDisplay.textContent = extrusion.toFixed(1);
        extrusionSlider.parentNode.insertBefore(extrusionDisplay, extrusionSlider.nextSibling);

        extrusionSlider.addEventListener("input", e => {
            let newValue = parseFloat(e.target.value);

            extrusion = newValue;
            extrusionDisplay.textContent = newValue.toFixed(1);

            updateExtrusion(newValue);  
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
        });
    }
}
 

