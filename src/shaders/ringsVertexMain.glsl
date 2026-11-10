// Finite-difference normal recalculation + vertex displacement
float eps = 0.012;
vec3 upRef = abs(objectNormal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
vec3 tangentT = normalize(cross(objectNormal, upRef));
vec3 bitangentB = normalize(cross(objectNormal, tangentT));

float crest0 = 0.0;
float noise0 = 0.0;
float dummyCrest = 0.0;
float dummyNoise = 0.0;

vec3 disp0 = computeRingDisplacement(transformed, objectNormal, aRingMeta, crest0, noise0);
vec3 dispT = computeRingDisplacement(transformed + tangentT * eps, objectNormal, aRingMeta, dummyCrest, dummyNoise);
vec3 dispB = computeRingDisplacement(transformed + bitangentB * eps, objectNormal, aRingMeta, dummyCrest, dummyNoise);

vec3 recomputedNormal = normalize(cross(dispT - disp0, dispB - disp0));
objectNormal = normalize(mix(objectNormal, recomputedNormal, 0.85));

#ifdef USE_TANGENT
  objectTangent = normalize(dispT - disp0);
#endif

transformed = disp0;
vCrestFactor = crest0;
vNoiseVal = noise0;
vProfileType = aRingMeta.w;

#ifdef USE_INSTANCING
  vWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
#else
  vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif
