import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { Track3D as Track3DData } from "../sim/buildTrack3d";
import { prepareGlbScene } from "./glbCar";
import { surfacePoint } from "./terrainHeight";

export const CITY_BUILDINGS_GLB = "/assets/cars3d/low-poly_city_buildings.glb";

/** Visual length of one imported city block cluster (world units). */
const CLUSTER_LENGTH = 90;

interface Props {
  track: Track3DData;
  groundY: number;
}

function hash01(n: number): number {
  const x = Math.sin(n * 91.17 + 17.3) * 43758.5453;
  return x - Math.floor(x);
}

type Placement = {
  position: THREE.Vector3;
  rotY: number;
  scale: number;
};

function collectBuildingPlacements(
  track: Track3DData,
  groundY: number,
): Placement[] {
  const cx = (track.bounds.min[0] + track.bounds.max[0]) / 2;
  const cz = (track.bounds.min[2] + track.bounds.max[2]) / 2;
  const spanX = track.bounds.max[0] - track.bounds.min[0];
  const spanZ = track.bounds.max[2] - track.bounds.min[2];
  const baseRadius = Math.max(spanX, spanZ) * 0.45 + 55;

  const out: Placement[] = [];
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + hash01(i) * 0.35;
    const dist = baseRadius + hash01(i + 50) * 45;
    const wx = cx + Math.cos(angle) * dist;
    const wz = cz + Math.sin(angle) * dist;
    const [, wy] = surfacePoint(wx, wz, track, groundY);
    out.push({
      position: new THREE.Vector3(wx, wy, wz),
      rotY: angle + Math.PI / 2 + (hash01(i + 60) - 0.5) * 0.4,
      scale: 0.55 + hash01(i + 70) * 0.45,
    });
  }

  // Distant skyline strip (lower detail feel, fills horizon).
  for (let j = 0; j < 6; j++) {
    const angle = hash01(j + 200) * Math.PI * 2;
    const dist = baseRadius + 95 + hash01(j + 201) * 40;
    const wx = cx + Math.cos(angle) * dist;
    const wz = cz + Math.sin(angle) * dist;
    const [, wy] = surfacePoint(wx, wz, track, groundY);
    out.push({
      position: new THREE.Vector3(wx, wy, wz),
      rotY: angle + Math.PI,
      scale: 0.35 + hash01(j + 202) * 0.25,
    });
  }

  return out;
}

function BuildingCluster({
  scene,
  placement,
}: {
  scene: THREE.Object3D;
  placement: Placement;
}) {
  const clone = useMemo(() => scene.clone(true), [scene]);
  return (
    <group
      position={placement.position}
      rotation={[0, placement.rotY, 0]}
      scale={placement.scale}
    >
      <primitive object={clone} />
    </group>
  );
}

export function CityBuildings({ track, groundY }: Props) {
  const gltf = useGLTF(CITY_BUILDINGS_GLB);
  const scene = useMemo(
    () =>
      prepareGlbScene(gltf.scene, {
        targetLength: CLUSTER_LENGTH,
        rotationY: Math.PI,
      }),
    [gltf.scene],
  );
  const placements = useMemo(
    () => collectBuildingPlacements(track, groundY),
    [track, groundY],
  );

  return (
    <group>
      {placements.map((p, i) => (
        <BuildingCluster key={i} scene={scene} placement={p} />
      ))}
    </group>
  );
}

useGLTF.preload(CITY_BUILDINGS_GLB);
