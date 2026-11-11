#include <emissivemap_fragment>
// Angle-dependent Fresnel reflection boost, subtle thin-film iridescence, and emissive crests
vec3 viewDir = normalize(vViewPosition);
float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
float fresnelTerm = pow(1.0 - NdotV, 3.4);

vec3 iridColor = thinFilmIridescence(NdotV, vNoiseVal);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.75 + 0.55 * iridColor), uIridescenceStrength * fresnelTerm);

float crestMask = smoothstep(0.25, 0.92, vCrestFactor);
vec3 crestGlow = uCrestEmissiveColor * crestMask * (uCrestEmissiveIntensity * (1.0 + uAudioTreble * 0.75));
vec3 fresnelRim = uFresnelColor * fresnelTerm * uFresnelIntensity;

totalEmissiveRadiance += crestGlow + fresnelRim;

