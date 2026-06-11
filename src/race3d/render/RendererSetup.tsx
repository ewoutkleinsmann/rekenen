import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

/** Crisp shadows and texture filtering — no screen-space blur passes. */
export function RendererSetup({ textures = [] }: { textures?: THREE.Texture[] }) {
  const { gl } = useThree();

  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;

    const aniso = gl.capabilities.getMaxAnisotropy();
    for (const tex of textures) {
      tex.anisotropy = aniso;
      tex.needsUpdate = true;
    }
  }, [gl, textures]);

  return null;
}
