varying float vCrestFactor;
varying float vNoiseVal;
varying vec3 vWorldPos;
varying float vProfileType;

uniform float uRoughnessNoiseAmp;
uniform float uIridescenceStrength;
uniform vec3 uFresnelColor;
uniform float uFresnelIntensity;
uniform vec3 uCrestEmissiveColor;
uniform float uCrestEmissiveIntensity;
uniform float uAudioTreble;

vec3 thinFilmIridescence(float cosTheta, float noiseShift) {
  float phase = (1.0 - cosTheta) * 2.4 + noiseShift * 0.55;
  return 0.5 + 0.5 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));
}
