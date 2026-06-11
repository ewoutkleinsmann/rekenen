import { useMemo } from "react";
import * as THREE from "three";
import {
  nodeAtDist,
  type CenterlineNode,
  type Track3D as Track3DData,
} from "../sim/buildTrack3d";
import { cross, normalize, type Vec3 } from "../sim/vec3";
import {
  createAsphaltMaps,
  createCheckeredTexture,
  createCurbStripeTexture,
} from "./proceduralTextures";
import { useGrassTextures } from "./landscapeTextures";
import { useCanvasTexture, useSurfaceMaps } from "./useSurfaceMaps";

interface Props {
  track: Track3DData;
}

function rightOf(node: CenterlineNode): Vec3 {
  return normalize(cross(node.up, node.forward));
}

function buildRibbon(
  nodes: CenterlineNode[],
  halfWidth: number,
  lift: number,
  include: (n: CenterlineNode) => boolean,
  lateralOffset = 0,
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
    const ox = r[0] * lateralOffset;
    const oy = r[1] * lateralOffset;
    const oz = r[2] * lateralOffset;
    const lx =
      n.pos[0] + ox + r[0] * halfWidth + n.up[0] * lift;
    const ly =
      n.pos[1] + oy + r[1] * halfWidth + n.up[1] * lift;
    const lz =
      n.pos[2] + oz + r[2] * halfWidth + n.up[2] * lift;
    const rx =
      n.pos[0] + ox - r[0] * halfWidth + n.up[0] * lift;
    const ry =
      n.pos[1] + oy - r[1] * halfWidth + n.up[1] * lift;
    const rz =
      n.pos[2] + oz - r[2] * halfWidth + n.up[2] * lift;
    positions.push(lx, ly, lz, rx, ry, rz);
    normals.push(n.up[0], n.up[1], n.up[2], n.up[0], n.up[1], n.up[2]);
    const v = n.dist * 0.035;
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

const _roadNormalScale = new THREE.Vector2(0.12, 0.12);
const _vergeNormalScale = new THREE.Vector2(0.25, 0.25);

export function Track3D({ track }: Props) {
  const vergeGrass = useGrassTextures(35);
  const asphalt = useSurfaceMaps(createAsphaltMaps);
  const curbMap = useCanvasTexture(createCurbStripeTexture);
  const checkeredMap = useCanvasTexture(createCheckeredTexture);

  const { grassGeo, roadGeo, boostGeo, centerGeo, leftLine, rightLine, leftCurb, rightCurb } =
    useMemo(() => {
      const hw = track.roadWidth / 2;
      return {
        grassGeo: buildRibbon(track.nodes, hw * 2.1, -0.08, () => true),
        roadGeo: buildRibbon(track.nodes, hw, 0.02, () => true),
        centerGeo: buildRibbon(track.nodes, hw * 0.05, 0.04, () => true),
        boostGeo: buildRibbon(track.nodes, hw * 0.82, 0.05, (n) => {
          const t = track.segments[n.segmentIndex]?.type;
          return t === "booster" || t === "rocket";
        }),
        leftLine: buildRibbon(track.nodes, hw * 0.04, 0.035, () => true, hw * 0.88),
        rightLine: buildRibbon(track.nodes, hw * 0.04, 0.035, () => true, -hw * 0.88),
        leftCurb: buildEdge(track.nodes, hw + 0.35, 0.55),
        rightCurb: buildEdge(track.nodes, -(hw + 0.35), 0.55),
      };
    }, [track]);

  const finish = useMemo(
    () => nodeAtDist(track.nodes, track.finishDist),
    [track],
  );
  const start = useMemo(() => nodeAtDist(track.nodes, 1), [track]);

  return (
    <group>
      {grassGeo && (
        <mesh geometry={grassGeo} receiveShadow>
          <meshStandardMaterial
            map={vergeGrass.map}
            normalMap={vergeGrass.normalMap}
            roughnessMap={vergeGrass.roughnessMap}
            color="#e8f0e8"
            roughness={0.9}
            metalness={0}
            envMapIntensity={0.12}
            normalScale={_vergeNormalScale}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {roadGeo && (
        <mesh geometry={roadGeo} receiveShadow castShadow>
          <meshPhysicalMaterial
            map={asphalt.map}
            normalMap={asphalt.normalMap}
            roughnessMap={asphalt.roughnessMap}
            color="#9aa3ad"
            roughness={0.52}
            metalness={0.15}
            clearcoat={0.42}
            clearcoatRoughness={0.18}
            envMapIntensity={0.55}
            normalScale={_roadNormalScale}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {leftLine && (
        <mesh geometry={leftLine}>
          <meshStandardMaterial
            color="#f5f7fa"
            roughness={0.25}
            metalness={0.05}
            envMapIntensity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {rightLine && (
        <mesh geometry={rightLine}>
          <meshStandardMaterial
            color="#f5f7fa"
            roughness={0.25}
            metalness={0.05}
            envMapIntensity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {centerGeo && (
        <mesh geometry={centerGeo}>
          <meshStandardMaterial
            color="#f0d050"
            emissive="#6a5200"
            emissiveIntensity={0.25}
            roughness={0.35}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {boostGeo && (
        <mesh geometry={boostGeo}>
          <meshStandardMaterial
            color="#3cc8f0"
            emissive="#0a98d0"
            emissiveIntensity={0.85}
            roughness={0.4}
            metalness={0.05}
            envMapIntensity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {leftCurb && (
        <mesh geometry={leftCurb} castShadow receiveShadow>
          <meshStandardMaterial
            map={curbMap}
            roughness={0.5}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {rightCurb && (
        <mesh geometry={rightCurb} castShadow receiveShadow>
          <meshStandardMaterial
            map={curbMap}
            roughness={0.5}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <StartPosts node={start} width={track.roadWidth} />
      <Gate
        node={finish}
        width={track.roadWidth}
        checkeredMap={checkeredMap}
      />
      <StartLine node={start} width={track.roadWidth} />
    </group>
  );
}

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
    const v = n.dist * 0.2;
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

function StartPosts({ node, width }: { node: CenterlineNode; width: number }) {
  const q = frameQuat(node);
  const right = new THREE.Vector3(...node.up)
    .clone()
    .cross(new THREE.Vector3(...node.forward))
    .normalize();
  const up = new THREE.Vector3(...node.up);
  const half = width / 2 + 0.5;
  const base = new THREE.Vector3(...node.pos).addScaledVector(up, 0.08);
  return (
    <group>
      <mesh
        position={base.clone().addScaledVector(right, half)}
        quaternion={q}
        castShadow
      >
        <boxGeometry args={[0.35, 3.2, 0.35]} />
        <meshStandardMaterial
          color="#eef1f6"
          roughness={0.3}
          metalness={0.25}
          envMapIntensity={0.8}
        />
      </mesh>
      <mesh
        position={base.clone().addScaledVector(right, -half)}
        quaternion={q}
        castShadow
      >
        <boxGeometry args={[0.35, 3.2, 0.35]} />
        <meshStandardMaterial
          color="#eef1f6"
          roughness={0.3}
          metalness={0.25}
          envMapIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

function Gate({
  node,
  width,
  checkeredMap,
}: {
  node: CenterlineNode;
  width: number;
  checkeredMap: THREE.CanvasTexture;
}) {
  const q = frameQuat(node);
  const right = new THREE.Vector3(...node.up)
    .clone()
    .cross(new THREE.Vector3(...node.forward))
    .normalize();
  const up = new THREE.Vector3(...node.up);
  const half = width / 2 + 0.6;
  const base = new THREE.Vector3(...node.pos).addScaledVector(up, 0.1);
  const bannerPos = base.clone().addScaledVector(up, 4.8);
  return (
    <group>
      <mesh
        position={base.clone().addScaledVector(right, half)}
        quaternion={q}
        castShadow
      >
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial
          color="#f2f4f8"
          roughness={0.3}
          metalness={0.25}
          envMapIntensity={0.75}
        />
      </mesh>
      <mesh
        position={base.clone().addScaledVector(right, -half)}
        quaternion={q}
        castShadow
      >
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial
          color="#f2f4f8"
          roughness={0.3}
          metalness={0.25}
          envMapIntensity={0.75}
        />
      </mesh>
      <mesh position={bannerPos} quaternion={q} castShadow>
        <boxGeometry args={[width + 1.6, 1.1, 0.25]} />
        <meshStandardMaterial
          map={checkeredMap}
          roughness={0.45}
          metalness={0.08}
          envMapIntensity={0.4}
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
      <meshStandardMaterial color="#f8f8f8" roughness={0.4} />
    </mesh>
  );
}
