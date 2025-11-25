export const vertexShaderSource = `#version 300 es
in vec4 a_position;
uniform mat4 u_matrix;

void main() {
  gl_Position = u_matrix * a_position;
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
