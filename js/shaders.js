export const vertexShaderSource = `#version 300 es
precision highp float;

in vec4 a_position;
uniform mat4 u_matrix;
uniform int u_mode; // 0=solid, 1=gradient, 2=rainbow

// >>> remove this (old per-letter min/max gradient uniforms - removed)
// uniform float u_letterMinY;
// uniform float u_letterMaxY;

// >>> add this (new uniforms for vertical mapping)
uniform float u_gradMinY;    // bottom Y of object-space mapping (startY)
uniform float u_gradHeight;  // object-space height (h)

out float v_height; // normalized 0..1 vertical coordinate passed to fragment
out vec3 v_pos;     // optionally pass position

void main() {
  // transform position for rasterization
  gl_Position = u_matrix * a_position;

  // compute normalized height for gradient: map a_position.y in [u_gradMinY, u_gradMinY+u_gradHeight] -> [0,1]
  float denom = max(u_gradHeight, 0.0001);
  v_height = clamp((a_position.y - u_gradMinY) / denom, 0.0, 1.0);

  v_pos = a_position.xyz;
}
`;

// >>> add this (fragment shader updated to blend three colors vertically)
export const fragmentShaderSource = `#version 300 es
precision highp float;

in float v_height;
in vec3 v_pos;

uniform vec4 u_color; // solid fallback
uniform int u_mode;   // 0=solid,1=gradient,2=rainbow

// >>> add this: 3 colors for vertical gradient (vec3)
uniform vec3 u_colorTop;    // corresponds to colorF
uniform vec3 u_colorMiddle; // corresponds to colorI
uniform vec3 u_colorBottom; // corresponds to colorT

out vec4 outColor;

void main() {
  if (u_mode == 0) {
    outColor = u_color;
    return;
  }

  if (u_mode == 1) {
    float t = clamp(v_height, 0.0, 1.0);
    vec3 color;
    if (t < 0.5) {
      float k = t * 2.0; // 0..1 between top and middle
      color = mix(u_colorTop, u_colorMiddle, k);
    } else {
      float k = (t - 0.5) * 2.0; // 0..1 between middle and bottom
      color = mix(u_colorMiddle, u_colorBottom, k);
    }
    outColor = vec4(color, 1.0);
    return;
  }

  // rainbow fallback
  float v = v_height;
  vec3 rcolor = vec3(
    0.5 + 0.5 * cos(6.28318 * (v + 0.0)),
    0.5 + 0.5 * cos(6.28318 * (v + 0.33)),
    0.5 + 0.5 * cos(6.28318 * (v + 0.66))
  );
  outColor = vec4(rcolor, 1.0);
}
`;
