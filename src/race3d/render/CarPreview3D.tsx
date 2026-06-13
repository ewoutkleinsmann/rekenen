import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { getCarModel, CAR_LENGTH } from "./carModels";
import { prepareGlbScene } from "./glbCar";

const ROT_SPEED = 0.45;

function PreviewGlb({
  url,
  rotationY = 0,
}: {
  url: string;
  rotationY?: number;
}) {
  const gltf = useGLTF(url);
  const scene = useMemo(
    () =>
      prepareGlbScene(gltf.scene, {
        targetLength: CAR_LENGTH,
        rotationY,
      }),
    [gltf.scene, rotationY],
  );
  const ref = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * ROT_SPEED;
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

function PreviewProcedural({ carId }: { carId: string }) {
  const def = getCarModel(carId);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * ROT_SPEED;
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.75, 0.55, 3.2]} />
        <meshStandardMaterial
          color={def.color}
          metalness={0.55}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.85, 0.35, 3.6]} />
        <meshStandardMaterial color={def.accent} roughness={0.45} />
      </mesh>
    </group>
  );
}

function PreviewCarModel({ carId }: { carId: string }) {
  const def = getCarModel(carId);
  if (def.glb) {
    return <PreviewGlb url={def.glb} rotationY={def.rotationY} />;
  }
  return <PreviewProcedural carId={carId} />;
}

interface CarPreview3DProps {
  carId: string;
  className?: string;
}

/** Small rotating GLB preview for shop / garage UI. */
export function CarPreview3D({ carId, className }: CarPreview3DProps) {
  return (
    <div
      className={className ? `car-preview-3d ${className}` : "car-preview-3d"}
      aria-hidden
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [2.4, 1.25, 3.4], fov: 36, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.62} />
        <directionalLight position={[5, 8, 4]} intensity={1.2} />
        <directionalLight position={[-4, 3, -3]} intensity={0.4} color="#b8dcff" />
        <pointLight position={[0, 2, 2]} intensity={12} distance={12} decay={2} />
        <Suspense fallback={null}>
          <PreviewCarModel carId={carId} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function preloadCarPreview(carId: string): void {
  const def = getCarModel(carId);
  if (def.glb) useGLTF.preload(def.glb);
}
