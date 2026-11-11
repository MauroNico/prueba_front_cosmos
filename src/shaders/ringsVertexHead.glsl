attribute vec4 aRingMeta; // x: phase, y: speed, z: radius, w: profileType
attribute vec3 aRingAxis;

varying float vCrestFactor;
varying float vNoiseVal;
varying vec3 vWorldPos;
varying float vProfileType;

uniform float uTime;
uniform float uNoiseAmplitude;
uniform float uNoiseFrequency;
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

vec3 computeRingDisplacement(vec3 localPos, vec3 localNorm, vec4 meta, out float outCrest, out float outNoise) {
  float phase = meta.x;
  float speed = meta.y;
  float ringRadius = meta.z;
  float profileType = meta.w;

  float motionScale = mix(1.0, 0.22, uReducedMotion);
  float t = uTime * motionScale;

  // 1. Sculpt cross-section profile per ring (0: round, 1: flat band, 2: notched ridge)
  vec3 p = localPos;
  if (profileType > 0.5 && profileType < 1.5) {
    p.z *= 1.45;
  } else if (profileType >= 1.5) {
    float ringAngle = atan(localPos.y, localPos.x);
    float notch = step(0.15, sin(ringAngle * 36.0 + phase));
    p += localNorm * (notch * 0.0035);
  }

  // 2. Traveling liquid waves along ring circumference + domain-warped 3D simplex noise
  float theta = atan(p.y, p.x);
  vec3 radialDir = normalize(vec3(p.x, p.y, 0.0) + vec3(1e-5, 0.0, 0.0));
  vec3 axialDir = vec3(0.0, 0.0, 1.0);

  float travelingWave = sin(theta * 5.0 - t * (1.7 + speed * 2.2) + phase) * 0.42
                      + cos(theta * 9.0 + t * 1.25 - phase * 1.5) * 0.22;

  vec3 sampleCoord = radialDir * ringRadius + vec3(cos(phase), sin(phase), phase * 0.35);
  vec2 liquid = warpedLiquidField(sampleCoord, t, uNoiseFrequency);
  float fieldVal = liquid.x * 0.68 + travelingWave * 0.32;

  // Audio bass boosts liquid amplitude and radial breathing pulse
  float effectiveAmp = uNoiseAmplitude * (1.0 + uAudioBass * 1.25) * motionScale;

  // 3. Viscous downward drip in resting regions + ribbon wave undulation
  float dripNoise = max(0.0, snoise(sampleCoord * 2.2 + vec3(0.0, t * 0.35, 0.0)));
  float undersideMask = clamp(-radialDir.y * 0.6 + 0.4, 0.0, 1.0);
  vec3 viscousDrip = vec3(0.0, -1.0, 0.0) * (dripNoise * dripNoise * undersideMask * effectiveAmp * 0.24);

  // Displace ring centerline radially & axially so rings bend like liquid mercury ribbons,
  // while keeping tube thickness sleek (subtle localNorm ripple)
  float radialWave = fieldVal * effectiveAmp * 0.52;
  float axialWave = sin(theta * 4.0 + t * 1.4 + phase) * liquid.x * effectiveAmp * 0.45;
  float tubeSurfaceRipple = fieldVal * effectiveAmp * 0.045;

  vec3 displaced = p
    + radialDir * radialWave
    + axialDir * axialWave
    + localNorm * tubeSurfaceRipple
    + viscousDrip;

  // Transform to world space via instanceMatrix to evaluate cursor gravity well & shockwave
  #ifdef USE_INSTANCING
    vec4 worldPos4 = modelMatrix * instanceMatrix * vec4(displaced, 1.0);
  #else
    vec4 worldPos4 = modelMatrix * vec4(displaced, 1.0);
  #endif
  vec3 worldPos = worldPos4.xyz;

  // 4. Cursor Gravitational Well: pull and ripple nearby rings toward 3D cursor
  vec3 toPointer = uPointerPos - worldPos;
  float distSq = dot(toPointer, toPointer);
  float gravityFalloff = exp(-distSq * 0.85) * uPointerPresence * mix(1.0, 0.35, uReducedMotion);
  float gravityRipple = sin(sqrt(distSq) * 8.0 - t * 5.0) * 0.25 + 0.75;
  vec3 worldOffset = toPointer * (gravityFalloff * 0.28 * gravityRipple);

  // 5. Click/Tap Radial Shockwave: expanding spherical wave that decays over time
  float shockActive = step(uShockwaveAge, 4.5) * uShockwaveStrength * (1.0 - uReducedMotion * 0.8);
  if (shockActive > 0.001) {
    vec3 fromShock = worldPos - uShockwaveOrigin;
    float distShock = length(fromShock) + 1e-4;
    float waveFront = uShockwaveAge * 2.85;
    float band = exp(-pow((distShock - waveFront) * 2.2, 2.0));
    float timeDecay = exp(-uShockwaveAge * 1.25);
    float carrier = sin((distShock - waveFront) * 12.0);
    float shockDisp = band * timeDecay * carrier * 0.24 * shockActive;
    worldOffset += (fromShock / distShock) * shockDisp;
    liquid.y = clamp(liquid.y + band * timeDecay * shockActive * 0.85, 0.0, 1.0);
  }

  #ifdef USE_INSTANCING
    mat3 invInstance = transpose(mat3(instanceMatrix));
    displaced += invInstance * (worldOffset * 0.48);
  #else
    displaced += worldOffset * 0.48;
  #endif

  outCrest = clamp(liquid.y + gravityFalloff * 0.55 + uAudioBass * 0.35, 0.0, 1.0);
  outNoise = fieldVal;
  return displaced;
}
