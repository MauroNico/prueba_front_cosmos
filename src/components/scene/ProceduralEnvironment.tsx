import { Environment, Lightformer } from '@react-three/drei';

export function ProceduralEnvironment() {
  return (
    <>
      <color attach="background" args={['#05070b']} />
      <fog attach="fog" args={['#05070b', 6.5, 18]} />

      {/* Strictly bounded dynamic lights (Core pointLight is in VolumetricCoreAndPostpro + 1 rim spotLight here = 2 total) */}
      <spotLight
        position={[-3.5, -2.4, 2.8]}
        intensity={22}
        color="#38d9f5"
        angle={0.85}
        penumbra={0.9}
        distance={16}
        decay={2}
      />

      {/* 100% procedural studio reflections via Lightformers (zero external HDRI files) */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="ring"
          intensity={3.5}
          color="#ffba6b"
          scale={[6, 6, 1]}
          position={[0, 4, -3]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.8}
          color="#4de3ff"
          scale={[8, 2, 1]}
          position={[-5, 1.5, 2]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#fff4e0"
          scale={[7, 1.5, 1]}
          position={[5, -1.5, 2]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="ring"
          intensity={1.8}
          color="#3bc9db"
          scale={[4, 4, 1]}
          position={[0, -4, 1]}
          target={[0, 0, 0]}
        />
      </Environment>
    </>
  );
}
