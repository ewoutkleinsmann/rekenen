import { useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { SurfaceMaps } from "./proceduralTextures";

export function useSurfaceMaps(create: () => SurfaceMaps): SurfaceMaps {
  const { gl } = useThree();
  const maps = useMemo(() => create(), [create]);

  useLayoutEffect(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    for (const tex of [maps.map, maps.normalMap, maps.roughnessMap]) {
      tex.anisotropy = aniso;
      tex.needsUpdate = true;
    }
  }, [gl, maps]);

  useEffect(
    () => () => {
      maps.map.dispose();
      maps.normalMap.dispose();
      maps.roughnessMap.dispose();
    },
    [maps],
  );

  return maps;
}

export function useCanvasTexture(
  factory: () => THREE.CanvasTexture,
): THREE.CanvasTexture {
  const { gl } = useThree();
  const tex = useMemo(factory, [factory]);

  useLayoutEffect(() => {
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
  }, [gl, tex]);

  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}
