attribute vec4 aParticleSeed; // x: phase, y: speed, z: baseSize, w: radialLayer

varying float vSpeed;
varying float vAlpha;
varying float vSpark;

uniform float uTime;
uniform float uTurbulence;
uniform vec3 uPointerPos;
uniform float uPointerPresence;
uniform vec3 uShockwaveOrigin;
uniform float uShockwaveAge;
uniform float uShockwaveStrength;
uniform float uAudioBass;
uniform float uAudioMid;
uniform float uAudioTreble;
uniform float uReducedMotion;

#include "./common/noise.glsl"

void main() {
  float phase = aParticleSeed.x;
  float speed = aParticleSeed.y;
  float baseSize = aParticleSeed.z;
  float layer = aParticleSeed.w;

  float motionScale = mix(1.0, 0.2, uReducedMotion);
  float t = uTime * motionScale;

  // Orbital rotation around Y and tilted X axis
  float angle = t * speed * (0.35 + uAudioMid * 0.45) + phase;
  float ca = cos(angle);
  float sa = sin(angle);
  vec3 pos = vec3(
    position.x * ca - position.z * sa,
    position.y + sin(t * 0.6 + phase) * 0.14 * motionScale,
    position.x * sa + position.z * ca
  );

  // 3D divergence-free Curl Noise displacement on GPU
  vec3 curlVel = curlNoise(pos * 0.48 + vec3(phase * 0.1), t * 0.55);
  vec3 displaced = pos + curlVel * (0.42 * uTurbulence * motionScale * (1.0 + uAudioBass * 0.6));

  // Cursor gravitational well attraction
  vec3 toPointer = uPointerPos - displaced;
  float distSq = dot(toPointer, toPointer) + 0.15;
  float gravityPull = exp(-distSq * 0.42) * uPointerPresence * mix(1.0, 0.3, uReducedMotion);
  vec3 pointerVelocity = toPointer * (gravityPull * 0.52);
  displaced += pointerVelocity;

  // Radial shockwave dispersion on click / tap
  vec3 shockVelocity = vec3(0.0);
  float shockActive = step(uShockwaveAge, 4.5) * uShockwaveStrength * (1.0 - uReducedMotion * 0.8);
  if (shockActive > 0.001) {
    vec3 fromShock = displaced - uShockwaveOrigin;
    float dist = length(fromShock) + 1e-4;
    float waveFront = uShockwaveAge * 3.1;
    float shell = exp(-pow((dist - waveFront) * 1.65, 2.0));
    float decay = exp(-uShockwaveAge * 1.1);
    shockVelocity = (fromShock / dist) * (shell * decay * 1.15 * shockActive);
    displaced += shockVelocity;
  }

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Velocity magnitude drives color temperature in fragment shader
  float speedMag = length(curlVel * 0.35 + pointerVelocity * 1.4 + shockVelocity * 1.8) + uAudioTreble * 0.65;
  vSpeed = clamp(speedMag, 0.0, 1.0);
  vSpark = step(0.78, layer);

  // Depth attenuation & treble brightness boost
  float depthAtten = 190.0 / max(-mvPosition.z, 0.8);
  float trebleScale = 1.0 + uAudioTreble * 1.35 + gravityPull * 0.45;
  gl_PointSize = clamp(baseSize * trebleScale * depthAtten, 1.0, 24.0);

  // Distance fade at outer boundary and near camera clipping plane
  float radialDist = length(displaced);
  float outerFade = 1.0 - smoothstep(4.2, 6.2, radialDist);
  float nearFade = smoothstep(0.6, 1.6, -mvPosition.z);
  vAlpha = outerFade * nearFade * (0.42 + uAudioTreble * 0.48 + gravityPull * 0.3);
}
