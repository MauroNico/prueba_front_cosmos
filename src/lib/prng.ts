export interface RingInstanceData {
  index: number;
  radius: number;
  tubeScale: number;
  profileType: number; // 0 = round, 1 = flat, 2 = notched
  axis: [number, number, number];
  initialQuat: [number, number, number, number];
  speed: number;
  phase: number;
}

/**
 * Deterministic 32-bit PRNG (Mulberry32).
 * Always produces the exact same sequence in [0, 1) for a given integer seed.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts Euler XYZ angles (in radians) to a normalized quaternion [x, y, z, w].
 */
export function eulerToQuaternion(
  rx: number,
  ry: number,
  rz: number,
): [number, number, number, number] {
  const c1 = Math.cos(rx * 0.5);
  const c2 = Math.cos(ry * 0.5);
  const c3 = Math.cos(rz * 0.5);
  const s1 = Math.sin(rx * 0.5);
  const s2 = Math.sin(ry * 0.5);
  const s3 = Math.sin(rz * 0.5);

  const x = s1 * c2 * c3 + c1 * s2 * s3;
  const y = c1 * s2 * c3 - s1 * c2 * s3;
  const z = c1 * c2 * s3 + s1 * s2 * c3;
  const w = c1 * c2 * c3 - s1 * s2 * s3;
  const len = Math.hypot(x, y, z, w) || 1;
  return [x / len, y / len, z / len, w / len];
}

/**
 * Generates deterministic armillary ring configurations.
 * Default count is 36 (within the required [24, 48] range).
 */
export function generateArmillaryRings(
  count = 36,
  seed = 133742,
): RingInstanceData[] {
  const clampedCount = Math.max(24, Math.min(48, Math.floor(count)));
  const rand = mulberry32(seed);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const rings: RingInstanceData[] = [];

  for (let i = 0; i < clampedCount; i++) {
    const t = i / (clampedCount - 1);

    // Stratified radius between 1.05 and 2.38 with subtle jitter
    const radius = 1.05 + t * 1.33 + (rand() - 0.5) * 0.035;

    // Vary cross-section thickness and profile type (0: round, 1: flat band, 2: notched)
    const tubeScale = 0.7 + rand() * 0.75;
    const profileType = i % 3;

    // Distribute axes across the unit sphere via Fibonacci spiral + deterministic perturbation
    const y = 1 - (i / Math.max(1, clampedCount - 1)) * 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i + rand() * 0.35;
    const ax = radial * Math.cos(theta);
    const az = radial * Math.sin(theta);
    const axisLen = Math.hypot(ax, y, az) || 1;
    const axis: [number, number, number] = [ax / axisLen, y / axisLen, az / axisLen];

    // Initial armillary orientation
    const rx = (rand() - 0.5) * Math.PI * 1.8;
    const ry = theta % (Math.PI * 2);
    const rz = (rand() - 0.5) * Math.PI;
    const initialQuat = eulerToQuaternion(rx, ry, rz);

    // Non-zero angular velocity in [-0.52, -0.12] U [0.12, 0.52] rad/s
    const direction = rand() > 0.5 ? 1 : -1;
    const speed = direction * (0.12 + rand() * 0.4);
    const phase = rand() * Math.PI * 2;

    rings.push({
      index: i,
      radius,
      tubeScale,
      profileType,
      axis,
      initialQuat,
      speed,
      phase,
    });
  }

  return rings;
}
