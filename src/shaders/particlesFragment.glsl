varying float vSpeed;
varying float vAlpha;
varying float vSpark;

uniform float uAudioTreble;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float rSq = dot(uv, uv);
  if (rSq > 0.25) {
    discard;
  }

  // Soft cosmic dust halo + bright spark core
  float halo = exp(-rSq * 14.0);
  float core = smoothstep(0.06, 0.0, rSq);
  float intensity = mix(halo, halo + core * 0.85, vSpark);

  // Color by velocity: cool cyan at low velocity -> warm amber -> incandescent white at high speed/treble
  vec3 slowColor = vec3(0.22, 0.82, 0.98); // Cool cyan
  vec3 midColor = vec3(1.0, 0.72, 0.32);   // Warm amber
  vec3 fastColor = vec3(1.0, 0.96, 0.88);  // Incandescent core

  vec3 particleColor = mix(slowColor, midColor, smoothstep(0.15, 0.62, vSpeed));
  particleColor = mix(particleColor, fastColor, smoothstep(0.62, 0.98, vSpeed + uAudioTreble * 0.35));

  gl_FragColor = vec4(particleColor * (1.0 + uAudioTreble * 0.8), intensity * vAlpha);
}
