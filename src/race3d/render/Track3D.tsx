import { useMemo } from "react";
import * as THREE from "three";
import {
  nodeAtDist,
  type CenterlineNode,
  type Track3D as Track3DData,
} from "../sim/buildTrack3d";
import { cross, normalize, type Vec3 } from "../sim/vec3";

interface Props {
  track: Track3DData;
}

function rightOf(node: CenterlineNode): Vec3 {
  return normalize(cross(node.up, node.forward));
}

/** Build a ribbon mesh following the centerline, optionally only for nodes that
 * pass `include`. Width is given as a half-width. */
function buildRibbon(
  nodes: CenterlineNode[],
  halfWidth: number,
  lift: number,
  include: (n: CenterlineNode) => boolean,
): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vert = 0;
  let prevValid = false;
  let prevBase = 0;

  for (const n of nodes) {
    const ok = n.solid && include(n);
    if (!ok) {
      prevValid = false;
      continue;
    }
    const r = rightOf(n);
    const lx = n.pos[0] + r[0] * halfWidth + n.up[0] * lift;
    const ly = n.pos[1] + r[1] * halfWidth + n.up[1] * lift;
    const lz = n.pos[2] + r[2] * halfWidth + n.up[2] * lift;
    const rx = n.pos[0] - r[0] * halfWidth + n.up[0] * lift;
    const ry = n.pos[1] - r[1] * halfWidth + n.up[1] * lift;
    const rz = n.pos[2] - r[2] * halfWidth + n.up[2] * lift;
    positions.push(lx, ly, lz, rx, ry, rz);
    normals.push(n.up[0], n.up[1], n.up[2], n.up[0], n.up[1], n.up[2]);
    const v = n.dist * 0.15;
    uvs.push(0, v, 1, v);

    if (prevValid) {
      const a = prevBase;
      const b = prevBase + 1;
      const c = vert;
      const d = vert + 1;
      indices.push(a, c, b, b, c, d);
    }
    prevBase = vert;
    prevValid = true;
    vert += 2;
  }

  if (positions.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

export function Track3D({ track }: Props) {
  const { roadGeo, boostGeo, centerGeo, leftCurb, rightCurb } = useMemo(() => {
    const hw = track.roadWidth / 2;
    return {
      roadGeo: buildRibbon(track.nodes, hw, 0, () => true),
      centerGeo: buildRibbon(track.nodes, hw * 0.06, 0.02, () => true),
      boostGeo: buildRibbon(track.nodes, hw * 0.85, 0.03, (n) => {
        const t = track.segments[n.segmentIndex]?.type;
        return t === "booster" || t === "rocket";
      }),
      leftCurb: buildEdge(track.nodes, hw, 0.45),
      rightCurb: buildEdge(track.nodes, -hw, 0.45),
    };
  }, [track]);

  const finish = useMemo(
    () => nodeAtDist(track.nodes, track.finishDist),
    [track],
  );
  const start = useMemo(() => nodeAtDist(track.nodes, 1), [track]);

  return (
    <group>
      {roadGeo && (
        <mesh geometry={roadGeo} receiveShadow>
          <meshStandardMaterial
            color="#2c2f36"
            roughness={0.85}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {centerGeo && (
        <mesh geometry={centerGeo}>
          <meshStandardMaterial
            color="#f4d03f"
            emissive="#3a2f00"
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {boostGeo && (
        <mesh geometry={boostGeo}>
          <meshStandardMaterial
            color="#19c3ff"
            emissive="#0aa3ff"
            emissiveIntensity={1.6}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {leftCurb && (
        <mesh geometry={leftCurb}>
          <meshStandardMaterial
            color="#ff3b30"
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {rightCurb && (
        <mesh geometry={rightCurb}>
          <meshStandardMaterial
            color="#ff3b30"
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <Gate node={finish} width={track.roadWidth} color="#ffffff" checkered />
      <StartLine node={start} width={track.roadWidth} />
    </group>
  );
}

/** Build a thin raised ribbon offset to one side of the road (curb). */
function buildEdge(
  nodes: CenterlineNode[],
  offset: number,
  width: number,
): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vert = 0;
  let prevValid = false;
  let prevBase = 0;

  for (const n of nodes) {
    if (!n.solid) {
      prevValid = false;
      continue;
    }
    const r = rightOf(n);
    const cx = n.pos[0] + r[0] * offset + n.up[0] * 0.06;
    const cy = n.pos[1] + r[1] * offset + n.up[1] * 0.06;
    const cz = n.pos[2] + r[2] * offset + n.up[2] * 0.06;
    const ix = r[0] * Math.sign(offset) * width;
    const iy = r[1] * Math.sign(offset) * width;
    const iz = r[2] * Math.sign(offset) * width;
    positions.push(cx, cy, cz, cx - ix, cy - iy, cz - iz);
    normals.push(n.up[0], n.up[1], n.up[2], n.up[0], n.up[1], n.up[2]);
    const v = n.dist * 0.3;
    uvs.push(0, v, 1, v);
    if (prevValid) {
      indices.push(prevBase, vert, prevBase + 1, prevBase + 1, vert, vert + 1);
    }
    prevBase = vert;
    prevValid = true;
    vert += 2;
  }
  if (positions.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function frameQuat(node: CenterlineNode): THREE.Quaternion {
  const f = new THREE.Vector3(...node.forward).normalize();
  const u = new THREE.Vector3(...node.up).normalize();
  const right = new THREE.Vector3().crossVectors(f, u).normalize();
  const upo = new THREE.Vector3().crossVectors(right, f).normalize();
  const m = new THREE.Matrix4().makeBasis(right, upo, f.clone().negate());
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

function Gate({
  node,
  width,
  color,
  checkered,
}: {
  node: CenterlineNode;
  width: number;
  color: string;
  checkered?: boolean;
}) {
  const q = frameQuat(node);
  const right = new THREE.Vector3(...node.up)
    .clone()
    .cross(new THREE.Vector3(...node.forward))
    .normalize();
  const half = width / 2 + 0.6;
  const base = new THREE.Vector3(...node.pos);
  const leftPost = base.clone().addScaledVector(right, half);
  const rightPost = base.clone().addScaledVector(right, -half);
  return (
    <group>
      <mesh position={leftPost} quaternion={q} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#e8eaed" />
      </mesh>
      <mesh position={rightPost} quaternion={q} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#e8eaed" />
      </mesh>
      <mesh
        position={base.clone().addScaledVector(new THREE.Vector3(0, 1, 0), 5)}
        quaternion={q}
      >
        <boxGeometry args={[width + 1.6, 1.2, 0.3]} />
        <meshStandardMaterial
          color={checkered ? "#111111" : color}
          emissive={checkered ? "#000000" : color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function StartLine({ node, width }: { node: CenterlineNode; width: number }) {
  const q = frameQuat(node);
  return (
    <mesh
      position={[
        node.pos[0] + node.up[0] * 0.05,
        node.pos[1] + node.up[1] * 0.05,
        node.pos[2] + node.up[2] * 0.05,
      ]}
      quaternion={q}
    >
      <boxGeometry args={[width, 0.05, 1.2]} />
      <meshStandardMaterial color="#f5f5f5" />
    </mesh>
  );
}
