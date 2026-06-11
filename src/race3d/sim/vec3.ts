/**
 * Minimal, dependency-free 3D vector helpers.
 *
 * The headless simulation runs in Node (vitest) where importing `three` would
 * be unnecessary weight, so the track builder and simulation use this tiny
 * tuple-based vector math instead.
 */
export type Vec3 = [number, number, number];

export function v(x = 0, y = 0, z = 0): Vec3 {
  return [x, y, z];
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function length(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}

export function normalize(a: Vec3): Vec3 {
  const len = length(a);
  if (len < 1e-9) return [0, 0, 0];
  return [a[0] / len, a[1] / len, a[2] / len];
}

export function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** Rotate vector `vec` around unit axis `axis` by `angle` radians (Rodrigues). */
export function rotateAround(vec: Vec3, axis: Vec3, angle: number): Vec3 {
  const k = normalize(axis);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const term1 = scale(vec, cos);
  const term2 = scale(cross(k, vec), sin);
  const term3 = scale(k, dot(k, vec) * (1 - cos));
  return add(add(term1, term2), term3);
}

/**
 * Quaternion (x, y, z, w) that rotates the basis (X=right, Y=up, Z=back) so
 * that local -Z maps to `forward` and local +Y maps to `up`. Used to orient
 * the car along the track frame for the replay.
 */
export type Quat = [number, number, number, number];

export function quatFromFrame(forward: Vec3, up: Vec3): Quat {
  // Build an orthonormal basis. Car convention: forward = local -Z.
  const f = normalize(forward);
  let u = normalize(up);
  let right = normalize(cross(f, u)); // f x up
  // Re-orthogonalize up.
  u = normalize(cross(right, f));
  // Columns of rotation matrix: right (X), up (Y), back=-f (Z).
  const back: Vec3 = [-f[0], -f[1], -f[2]];
  if (length(right) < 1e-6) right = [1, 0, 0];

  const m00 = right[0],
    m01 = u[0],
    m02 = back[0];
  const m10 = right[1],
    m11 = u[1],
    m12 = back[1];
  const m20 = right[2],
    m21 = u[2],
    m22 = back[2];

  const trace = m00 + m11 + m22;
  let qw: number, qx: number, qy: number, qz: number;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1.0) * 2;
    qw = 0.25 * s;
    qx = (m21 - m12) / s;
    qy = (m02 - m20) / s;
    qz = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
    qw = (m21 - m12) / s;
    qx = 0.25 * s;
    qy = (m01 + m10) / s;
    qz = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
    qw = (m02 - m20) / s;
    qx = (m01 + m10) / s;
    qy = 0.25 * s;
    qz = (m12 + m21) / s;
  } else {
    const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
    qw = (m10 - m01) / s;
    qx = (m02 + m20) / s;
    qy = (m12 + m21) / s;
    qz = 0.25 * s;
  }
  return [qx, qy, qz, qw];
}
