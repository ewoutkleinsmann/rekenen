import * as THREE from "three";
import type { Track3D } from "../sim/buildTrack3d";

/** Raw rolling hills (offset from baseY). */
export function terrainHeight(x: number, z: number): number {
  const a = Math.sin(x * 0.011) * Math.cos(z * 0.008) * 5.5;
  const b = Math.sin(x * 0.023 + 0.8) * Math.sin(z * 0.019 + 0.4) * 2.8;
  const c = Math.cos(x * 0.0055) * Math.cos(z * 0.0062) * 7;
  const d = Math.sin((x + z) * 0.009) * 1.8;
  return a + b + c + d;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Distance in XZ to the track centerline and interpolated road height. */
export function nearestTrackPoint(
  track: Track3D,
  wx: number,
  wz: number,
): { dist: number; trackY: number } {
  const nodes = track.nodes;
  let bestDist = Infinity;
  let bestY = nodes[0]?.pos[1] ?? 0;

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]!;
    const b = nodes[i + 1]!;
    const ax = a.pos[0],
      az = a.pos[2];
    const bx = b.pos[0],
      bz = b.pos[2];
    const dx = bx - ax,
      dz = bz - az;
    const lenSq = dx * dx + dz * dz;
    let t = 0;
    if (lenSq > 1e-6) {
      t = ((wx - ax) * dx + (wz - az) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = Math.hypot(wx - px, wz - pz);
    const py = a.pos[1] + (b.pos[1] - a.pos[1]) * t;
    if (d < bestDist) {
      bestDist = d;
      bestY = py;
    }
  }

  return { dist: bestDist, trackY: bestY };
}

/** Flat corridor under the track, rolling hills outside (valley layout). */
const CORRIDOR_INNER = 20;
const CORRIDOR_BLEND = 38;

export function landscapeHeight(
  wx: number,
  wz: number,
  track: Track3D,
  baseY: number,
): number {
  const { dist, trackY } = nearestTrackPoint(track, wx, wz);
  const wild = baseY + terrainHeight(wx, wz);
  const flat = trackY - 0.35;
  const blend = smoothstep(CORRIDOR_INNER, CORRIDOR_INNER + CORRIDOR_BLEND, dist);
  return flat * (1 - blend) + wild * blend;
}

export interface TerrainPatch {
  cx: number;
  cz: number;
  size: number;
  segments: number;
  baseY: number;
  track: Track3D;
}

export function buildTerrainGeometry(patch: TerrainPatch): THREE.BufferGeometry {
  const { cx, cz, size, segments, baseY, track } = patch;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    const wx = cx + lx;
    const wz = cz + lz;
    pos.setY(i, landscapeHeight(wx, wz, track, baseY));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** World position on the landscape surface (trees, props). */
export function surfacePoint(
  wx: number,
  wz: number,
  track: Track3D,
  baseY: number,
): [number, number, number] {
  return [wx, landscapeHeight(wx, wz, track, baseY), wz];
}
