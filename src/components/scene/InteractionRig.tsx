import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CameraPresetId } from '../../content';
import { sharedAudioEngine } from '../../lib/audioEngine';
import { dampScalar, stepCriticallyDamped3DInPlace } from '../../lib/math';
import {
  transientLabState,
  triggerShockwave,
  useLabStore,
} from '../../store/useLabStore';

// Pre-allocated scratch objects for ray-plane intersection (zero GC inside frame loop)
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2(0, 0);
const _planeNormal = new THREE.Vector3(0, 0, 1);
const _originPoint = new THREE.Vector3(0, 0, 0);
const _interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _intersectionPoint = new THREE.Vector3();
const _cameraGoal = new THREE.Vector3(0, 0, 5.8);

const CAMERA_PRESET_POSITIONS: Record<CameraPresetId, [number, number, number]> = {
  frontal: [0, 0.15, 5.8],
  zenith: [0, 5.6, 0.85],
  detail: [2.15, 0.65, 2.75],
};

export function InteractionRig() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const cameraPreset = useLabStore((s) => s.cameraPreset);
  const mode = useLabStore((s) => s.mode);
  const motionPaused = useLabStore((s) => s.motionPaused);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);

  const isCameraTravellingRef = useRef(false);
  const pointerDownInfoRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const userInteractingCameraRef = useRef(false);

  // Trigger smooth camera travelling whenever cameraPreset changes
  useEffect(() => {
    const pos = CAMERA_PRESET_POSITIONS[cameraPreset];
    _cameraGoal.set(pos[0], pos[1], pos[2]);
    isCameraTravellingRef.current = true;
  }, [cameraPreset]);

  // Unified Pointer Events (mouse, touch, pen) on the WebGL canvas element
  useEffect(() => {
    const domElement = gl.domElement;

    const updatePointerFromEvent = (clientX: number, clientY: number) => {
      const rect = domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      camera.getWorldDirection(_planeNormal).negate();
      _interactionPlane.setFromNormalAndCoplanarPoint(_planeNormal, _originPoint);
      _raycaster.setFromCamera(_ndc, camera);

      const hit = _raycaster.ray.intersectPlane(_interactionPlane, _intersectionPoint);
      if (hit) {
        // Clamp to reasonable sphere vicinity
        _intersectionPoint.clampLength(0, 3.6);
        transientLabState.pointerTarget3D.x = _intersectionPoint.x;
        transientLabState.pointerTarget3D.y = _intersectionPoint.y;
        transientLabState.pointerTarget3D.z = _intersectionPoint.z;
        transientLabState.pointerPresenceTarget = 1.0;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointerFromEvent(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePointerFromEvent(e.clientX, e.clientY);
      pointerDownInfoRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
      };
      isCameraTravellingRef.current = false;
      userInteractingCameraRef.current = true;
    };

    const onPointerUp = (e: PointerEvent) => {
      userInteractingCameraRef.current = false;
      const down = pointerDownInfoRef.current;
      pointerDownInfoRef.current = null;
      if (!down) return;

      const dist = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const elapsed = performance.now() - down.time;

      // Only trigger radial shockwave on clean click / tap (not after camera orbit drag)
      if (dist < 10 && elapsed < 380) {
        updatePointerFromEvent(e.clientX, e.clientY);
        const strength = prefersReducedMotion || motionPaused ? 0.2 : 1.0;
        triggerShockwave(
          transientLabState.pointerTarget3D.x,
          transientLabState.pointerTarget3D.y,
          transientLabState.pointerTarget3D.z,
          strength,
        );
      }
    };

    const onPointerLeave = () => {
      transientLabState.pointerPresenceTarget = 0.0;
      userInteractingCameraRef.current = false;
    };

    domElement.addEventListener('pointermove', onPointerMove, { passive: true });
    domElement.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    domElement.addEventListener('pointerleave', onPointerLeave, { passive: true });
    domElement.addEventListener('pointercancel', onPointerLeave, { passive: true });

    return () => {
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointerleave', onPointerLeave);
      domElement.removeEventListener('pointercancel', onPointerLeave);
    };
  }, [camera, gl.domElement, motionPaused, prefersReducedMotion]);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);

    // 0. Sample FFT 3-band audio spectrum (Bass, Mid, Treble) with attack/release envelope
    const bands = sharedAudioEngine.sampleBands(safeDelta);
    transientLabState.audioBands.bass = bands.bass;
    transientLabState.audioBands.mid = bands.mid;
    transientLabState.audioBands.treble = bands.treble;

    // 1. Frame-rate independent critical damping for 3D pointer (omega = 12.5)
    stepCriticallyDamped3DInPlace(
      transientLabState.pointer3D,
      transientLabState.pointerTarget3D.x,
      transientLabState.pointerTarget3D.y,
      transientLabState.pointerTarget3D.z,
      12.5,
      safeDelta,
    );

    transientLabState.pointerPresence = dampScalar(
      transientLabState.pointerPresence,
      transientLabState.pointerPresenceTarget,
      6.0,
      safeDelta,
    );

    // 2. Delayed volumetric light core following cursor (or gently orbiting inside sphere when idle)
    const t = state.clock.elapsedTime;
    const idleOrbitScale = (1 - transientLabState.pointerPresence) * (motionPaused || prefersReducedMotion ? 0.08 : 0.38);
    const lightTargetX =
      transientLabState.pointerTarget3D.x * 0.42 * transientLabState.pointerPresence +
      Math.cos(t * 0.65) * idleOrbitScale;
    const lightTargetY =
      transientLabState.pointerTarget3D.y * 0.42 * transientLabState.pointerPresence +
      Math.sin(t * 0.85) * idleOrbitScale * 0.75;
    const lightTargetZ =
      transientLabState.pointerTarget3D.z * 0.42 * transientLabState.pointerPresence +
      Math.sin(t * 0.5) * idleOrbitScale;

    stepCriticallyDamped3DInPlace(
      transientLabState.lightPos3D,
      lightTargetX,
      lightTargetY,
      lightTargetZ,
      4.5,
      safeDelta,
    );

    // 3. Advance radial shockwave decay timer
    if (transientLabState.shockwave.age < 10) {
      transientLabState.shockwave.age += safeDelta;
    }

    // 4. Smooth camera preset travelling
    if (isCameraTravellingRef.current && !userInteractingCameraRef.current) {
      const alpha = 1 - Math.exp(-4.2 * safeDelta);
      camera.position.lerp(_cameraGoal, alpha);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(_originPoint, alpha);
        controlsRef.current.update();
      }
      if (camera.position.distanceToSquared(_cameraGoal) < 0.0025) {
        isCameraTravellingRef.current = false;
      }
    }
  });

  const autoRotateActive =
    mode === 'exhibition' && !prefersReducedMotion && !motionPaused;

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.055}
      rotateSpeed={0.75}
      zoomSpeed={0.8}
      minDistance={2.5}
      maxDistance={9.2}
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI - 0.18}
      autoRotate={autoRotateActive}
      autoRotateSpeed={0.65}
    />
  );
}
