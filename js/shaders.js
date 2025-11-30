export const vertexShaderSource = `#version 300 es
precision highp float;

in vec4 a_position;
uniform mat4 u_matrix;
uniform int u_mode; // 0=solid, 1=gradient, 2=rainbow

// added for lighting
// new attributes for normals
in vec3 a_normal;
out vec3 v_normal;

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

  // added for lighting
  // pass normal into frag shader
  v_normal = a_normal;
}
`;

// >>> add this (fragment shader updated to blend three colors vertically)
export const fragmentShaderSource = `#version 300 es
precision highp float;

in float v_height;
in vec3 v_pos;

// added for lighting
// receive normals from vertex shader
in vec3 v_normal;
uniform vec3 u_lightDir;        // direction vector of the light
uniform float u_lightStrength;  // brightness multiplier

uniform vec4 u_color; // solid fallback
uniform int u_mode;   // 0=solid,1=gradient,2=rainbow

//3 colors for vertical gradient (vec3)
uniform vec3 u_colorTop;    // corresponds to colorF
uniform vec3 u_colorMiddle; // corresponds to colorI
uniform vec3 u_colorBottom; // corresponds to colorT

out vec4 outColor;

void main() {

    vec3 baseColor; // will hold color before lighting

    if (u_mode == 0) {
        baseColor = u_color.rgb; // solid mode
    }
    else if (u_mode == 1) {
        float t = clamp(v_height, 0.0, 1.0);
        if (t < 0.5) {
            float k = t * 2.0; // 0..1 between top and middle
            baseColor = mix(u_colorTop, u_colorMiddle, k);
        } else {
            float k = (t - 0.5) * 2.0; // 0..1 between middle and bottom
            baseColor = mix(u_colorMiddle, u_colorBottom, k);
        }
    }
    else if (u_mode == 2) {
        float v = clamp(v_height, 0.0, 1.0); // rainbow mode
        baseColor = vec3(
            0.5 + 0.5 * cos(6.28318 * (v + 0.0)),
            0.5 + 0.5 * cos(6.28318 * (v + 0.33)),
            0.5 + 0.5 * cos(6.28318 * (v + 0.66))
        );
    }

    // added for lighting
    vec3 N = normalize(v_normal);       // surface normal
    vec3 L = normalize(u_lightDir);     // light direction
    float diffuse = max(dot(N, L), 0.0); // diffuse brightness factor

    float lightFactor = mix(0.3, 1.0, diffuse * u_lightStrength); // final light factor
    vec3 finalColor = baseColor * lightFactor; // apply lighting

    outColor = vec4(finalColor, 1.0);
}
`;
