// Shared 3D Simplex Noise & Curl Noise Library
// Based on Stefan Gustavson / Ian McEwan Ashima Arts (MIT License)

vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(
    permute(
      permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
      i.y + vec4(0.0, i1.y, i2.y, 1.0)
    ) +
    i.x + vec4(0.0, i1.x, i2.x, 1.0)
  );

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Domain-warped 3D liquid field with surface-tension smoothing on crests
vec2 warpedLiquidField(vec3 p, float time, float freq) {
  vec3 q = vec3(
    snoise(p * freq + vec3(0.0, time * 0.35, 0.0)),
    snoise(p * freq + vec3(5.2, 1.3 - time * 0.28, 2.8)),
    snoise(p * freq + vec3(1.7, 9.2, 3.4 + time * 0.32))
  );

  vec3 warpedCoord = p * (freq * 1.35) + 0.62 * q + vec3(time * 0.22, -time * 0.4, time * 0.18);
  float rawWave = snoise(warpedCoord);

  // Apparent surface tension: round off sharp peaks smoothly (soft saturation on crests)
  float smoothedWave = rawWave / (1.0 + 0.55 * abs(rawWave));
  float crestFactor = smoothstep(0.12, 0.72, rawWave);

  return vec2(smoothedWave, crestFactor);
}

// 3D divergence-free Curl Noise for GPU cosmic dust & liquid turbulence
vec3 curlNoise(vec3 p, float time) {
  const float e = 0.08;
  vec3 tOffset = vec3(time * 0.14, -time * 0.11, time * 0.09);
  vec3 q = p + tOffset;

  float n1 = snoise(vec3(q.x, q.y + e, q.z));
  float n2 = snoise(vec3(q.x, q.y - e, q.z));
  float n3 = snoise(vec3(q.x, q.y, q.z + e));
  float n4 = snoise(vec3(q.x, q.y, q.z - e));
  float n5 = snoise(vec3(q.x + e, q.y, q.z));
  float n6 = snoise(vec3(q.x - e, q.y, q.z));

  float x = (n1 - n2) - (n3 - n4);
  float y = (n3 - n4) - (n5 - n6);
  float z = (n5 - n6) - (n1 - n2);

  return normalize(vec3(x, y, z) + vec3(1e-5));
}

