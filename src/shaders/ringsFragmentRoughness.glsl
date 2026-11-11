#include <roughnessmap_fragment>
// Modulate surface roughness dynamically with 3D liquid noise & crest tension
float dynamicRoughnessOffset = vNoiseVal * uRoughnessNoiseAmp - vCrestFactor * 0.06;
roughnessFactor = clamp(roughnessFactor + dynamicRoughnessOffset, 0.04, 0.92);

