export const vertexShaderSource = `#version 300 es
precision mediump int;

in vec4 a_position;
uniform mat4 u_matrix;
uniform int u_mode; // 0=solid, 1=gradient, 2=rainbow
out vec4 v_color;

void main() {
gl_Position = u_matrix * a_position;

if (u_mode == 1) {
    float t = (a_position.y + 150.0) / 300.0;
    v_color = mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0), t);
} else if (u_mode == 2) {
    float t = (a_position.x + 300.0) / 600.0;
    v_color = vec4(
        0.5 + 0.5 * sin(6.2831 * t),
        0.5 + 0.5 * sin(6.2831 * t + 2.0),
        0.5 + 0.5 * sin(6.2831 * t + 4.0),
        1.0
    );
} else {
    v_color = vec4(1.0, 1.0, 1.0, 1.0);
}
}
`;

export const fragmentShaderSource = `#version 300 es
precision mediump float;


in vec4 v_color;
uniform vec4 u_color;
uniform int u_mode;
out vec4 outColor;

void main() {
  if (u_mode == 0) {
  // Solid: uniform color
  outColor = u_color;
  } else {
  // Gradient or Rainbow: use vertex shader color
  outColor = v_color;
  }
}
`;
