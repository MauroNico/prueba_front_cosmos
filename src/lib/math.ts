export interface DampedScalarState {
  position: number;
  velocity: number;
}

export interface DampedVec3State {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

/**
 * Frame-rate independent critically damped spring step (1D).
 * Uses analytical exponential decay so 30fps, 60fps, and 144fps converge identically.
 *
 * @param current Current value and velocity
 * @param target Target value
 * @param omega Natural frequency (stiffness), e.g., 8..18
 * @param dt Delta time in seconds (clamped to avoid tab-switch explosion)
 */
export function stepCriticallyDamped1D(
  current: DampedScalarState,
  target: number,
  omega: number,
  dt: number,
): DampedScalarState {
  const safeDt = Math.min(Math.max(dt, 0), 0.1);
  if (safeDt === 0 || omega <= 0) {
    return current;
  }

  const delta = current.position - target;
  const exp = Math.exp(-omega * safeDt);
  const temp = (current.velocity + omega * delta) * safeDt;

  const nextPos = target + (delta + temp) * exp;
  const nextVel = (current.velocity - temp * omega) * exp;

  return {
    position: nextPos,
    velocity: nextVel,
  };
}

/**
 * Frame-rate independent critically damped spring step (3D in-place mutation to avoid GC).
 */
export function stepCriticallyDamped3DInPlace(
  state: DampedVec3State,
  targetX: number,
  targetY: number,
  targetZ: number,
  omega: number,
  dt: number,
): void {
  const safeDt = Math.min(Math.max(dt, 0), 0.1);
  if (safeDt === 0 || omega <= 0) {
    return;
  }

  const exp = Math.exp(-omega * safeDt);

  const dx = state.x - targetX;
  const tx = (state.vx + omega * dx) * safeDt;
  state.x = targetX + (dx + tx) * exp;
  state.vx = (state.vx - tx * omega) * exp;

  const dy = state.y - targetY;
  const ty = (state.vy + omega * dy) * safeDt;
  state.y = targetY + (dy + ty) * exp;
  state.vy = (state.vy - ty * omega) * exp;

  const dz = state.z - targetZ;
  const tz = (state.vz + omega * dz) * safeDt;
  state.z = targetZ + (dz + tz) * exp;
  state.vz = (state.vz - tz * omega) * exp;
}

/**
 * Frame-rate independent exponential decay smoothing (first-order filter).
 */
export function dampScalar(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  const safeDt = Math.min(Math.max(dt, 0), 0.1);
  return target + (current - target) * Math.exp(-lambda * safeDt);
}

/**
 * Attack/release envelope follower for FFT audio bands, independent of frame rate.
 */
export function stepAudioEnvelope(
  current: number,
  target: number,
  attackRate: number,
  releaseRate: number,
  dt: number,
): number {
  const rate = target > current ? attackRate : releaseRate;
  return dampScalar(current, target, rate, dt);
}
