import { useMemo } from "react";
import * as THREE from "three";
import { Cloud } from "@react-three/drei";
import {
  type CenterlineNode,
  type Track3D as Track3DData,
} from "../sim/buildTrack3d";
import { cross, normalize, type Vec3 } from "../sim/vec3";
import { surfacePoint } from "./terrainHeight";

interface Props {
  track: Track3DData;
  groundY: number;
}

function rightOf(node: CenterlineNode): Vec3 {
  return normalize(cross(node.up, node.forward));
}

function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type TreePlacement = {
  pos: THREE.Vector3;
  scale: number;
  hue: number;
};

function collectTreePlacements(
  track: Track3DData,
  groundY: number,
): TreePlacement[] {
  const out: TreePlacement[] = [];
  const nodes = track.nodes;
  for (let i = 6; i < nodes.length; i += 7) {
    const n = nodes[i]!;
    if (!n.solid) continue;
    const side = hash01(i + 1) > 0.5 ? 1 : -1;
    const r = rightOf(n);
    const lateral = (14 + hash01(i + 2) * 22) * side;
    const wx = n.pos[0] + r[0] * lateral;
    const wz = n.pos[2] + r[2] * lateral;
    const [, wy] = surfacePoint(wx, wz, track, groundY);
    out.push({
      pos: new THREE.Vector3(wx, wy, wz),
      scale: 1.1 + hash01(i + 4) * 1.1,
      hue: hash01(i + 5) * 0.1,
    });
  }

  const cx = (track.bounds.min[0] + track.bounds.max[0]) / 2;
  const cz = (track.bounds.min[2] + track.bounds.max[2]) / 2;
  for (let k = 0; k < 48; k++) {
    const angle = hash01(k + 400) * Math.PI * 2;
    const dist = 55 + hash01(k + 401) * 120;
    const wx = cx + Math.cos(angle) * dist;
    const wz = cz + Math.sin(angle) * dist;
    const [, wy] = surfacePoint(wx, wz, track, groundY);
    out.push({
      pos: new THREE.Vector3(wx, wy, wz),
      scale: 0.9 + hash01(k + 402) * 1.4,
      hue: hash01(k + 403) * 0.12,
    });
  }

  return out;
}

function Tree({ pos, scale, hue }: TreePlacement) {
  const trunkColor = new THREE.Color().setHSL(0.08, 0.4, 0.32);
  const leafColor = new THREE.Color().setHSL(0.32 + hue, 0.65, 0.38);
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.38, 2.6, 8]} />
        <meshStandardMaterial
          color={trunkColor}
          roughness={0.88}
          envMapIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.65, 3.2, 8]} />
        <meshStandardMaterial
          color={leafColor}
          roughness={0.78}
          envMapIntensity={0.25}
        />
      </mesh>
      <mesh position={[0, 5.4, 0]} castShadow>
        <coneGeometry args={[1.15, 2.4, 8]} />
        <meshStandardMaterial
          color={leafColor}
          roughness={0.78}
          envMapIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

function ScatterRocks({
  track,
  groundY,
}: {
  track: Track3DData;
  groundY: number;
}) {
  const rocks = useMemo(() => {
    const list: { pos: THREE.Vector3; s: number; rot: number }[] = [];
    for (let i = 20; i < track.nodes.length; i += 23) {
      const n = track.nodes[i]!;
      if (!n.solid) continue;
      if (hash01(i + 99) > 0.55) continue;
      const r = rightOf(n);
      const side = hash01(i + 7) > 0.5 ? 1 : -1;
      const lateral = (10 + hash01(i + 8) * 8) * side;
      const wx = n.pos[0] + r[0] * lateral;
      const wz = n.pos[2] + r[2] * lateral;
      const [, wy] = surfacePoint(wx, wz, track, groundY);
      list.push({
        pos: new THREE.Vector3(wx, wy + 0.15, wz),
        s: 0.6 + hash01(i + 9) * 1.2,
        rot: hash01(i + 10) * Math.PI,
      });
    }
    return list;
  }, [track, groundY]);

  return (
    <group>
      {rocks.map((rock, i) => (
        <mesh
          key={i}
          position={rock.pos}
          rotation={[0, rock.rot, 0]}
          scale={rock.s}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color="#6b6f68" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function TrackSurroundings({ track, groundY }: Props) {
  const cx = (track.bounds.min[0] + track.bounds.max[0]) / 2;
  const cz = (track.bounds.min[2] + track.bounds.max[2]) / 2;
  const trees = useMemo(
    () => collectTreePlacements(track, groundY),
    [track, groundY],
  );

  const clouds = useMemo(
    () => [
      [cx - 80, groundY + 95, cz - 60],
      [cx + 120, groundY + 110, cz + 40],
      [cx - 40, groundY + 88, cz + 100],
      [cx + 60, groundY + 102, cz - 120],
    ] as [number, number, number][],
    [cx, cz, groundY],
  );

  return (
    <group>
      <ScatterRocks track={track} groundY={groundY} />
      {trees.map((t, i) => (
        <Tree key={i} {...t} />
      ))}
      {clouds.map((p, i) => (
        <Cloud
          key={i}
          position={p}
          opacity={0.42}
          speed={0.15}
          bounds={[14, 1.8, 5]}
          segments={18}
          volume={8}
          color="#f5f8ff"
        />
      ))}
    </group>
  );
}
