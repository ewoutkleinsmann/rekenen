import { useMemo } from "react";
import * as THREE from "three";
import { buildTerrainGeometry } from "./terrainHeight";
import type { Track3D } from "../sim/buildTrack3d";
import { useGrassTextures } from "./landscapeTextures";

interface Props {
  track: Track3D;
  cx: number;
  cz: number;
  baseY: number;
  size?: number;
  segments?: number;
}

const _normalScale = new THREE.Vector2(0.35, 0.35);

export function Terrain({
  track,
  cx,
  cz,
  baseY,
  size = 900,
  segments = 128,
}: Props) {
  const grass = useGrassTextures(70);
  const geometry = useMemo(
    () =>
      buildTerrainGeometry({
        cx,
        cz,
        size,
        segments,
        baseY,
        track,
      }),
    [cx, cz, size, segments, baseY, track],
  );

  return (
    <mesh geometry={geometry} position={[cx, 0, cz]} receiveShadow>
      <meshStandardMaterial
        map={grass.map}
        normalMap={grass.normalMap}
        roughnessMap={grass.roughnessMap}
        color="#ffffff"
        roughness={0.92}
        metalness={0}
        envMapIntensity={0.15}
        normalScale={_normalScale}
      />
    </mesh>
  );
}
