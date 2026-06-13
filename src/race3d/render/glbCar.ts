import * as THREE from "three";

export interface PrepareGlbOptions {
  /** Target length along the longest horizontal axis (world units). */
  targetLength: number;
  /** Extra Y rotation in radians (model forward should be -Z). */
  rotationY?: number;
}

/**
 * Clone a glTF scene, scale to target length, sit on Y=0, center on X/Z.
 */
export function prepareGlbScene(
  source: THREE.Object3D,
  options: PrepareGlbOptions,
): THREE.Object3D {
  const { targetLength, rotationY = 0 } = options;
  const root = new THREE.Group();
  const clone = source.clone(true);
  if (rotationY !== 0) clone.rotation.y = rotationY;
  root.add(clone);

  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const longest = Math.max(size.x, size.z, 1e-6);
  const scale = targetLength / longest;
  root.scale.setScalar(scale);

  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  box.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const mat of mats) {
      if (!mat || !("roughness" in mat)) continue;
      const std = mat as THREE.MeshStandardMaterial;
      std.envMapIntensity = 1.15;
      if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
      std.roughness = Math.min(std.roughness, 0.5);
      std.metalness = Math.max(std.metalness, 0.25);
    }
  });

  return root;
}

/** All GLB paths registered in carModels (for preloading). */
export function collectCarGlbUrls(
  models: Record<string, { glb?: string }>,
): string[] {
  const urls = new Set<string>();
  for (const def of Object.values(models)) {
    if (def.glb) urls.add(def.glb);
  }
  return [...urls];
}
