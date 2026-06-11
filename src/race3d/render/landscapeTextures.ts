import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

/**
 * CC0 aerial grass (Poly Haven “aerial_grass_rock”), vendored under public/
 * so the race view works offline and does not depend on renamed CDN paths.
 */
const GRASS_DIFF = "/assets/textures/aerial_grass_rock/diff_1k.jpg";
const GRASS_NORM = "/assets/textures/aerial_grass_rock/nor_gl_1k.jpg";
const GRASS_ROUGH = "/assets/textures/aerial_grass_rock/rough_1k.jpg";

const GRASS_URLS = [GRASS_DIFF, GRASS_NORM, GRASS_ROUGH] as const;

export interface GrassTextures {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

export function useGrassTextures(repeat = 90): GrassTextures {
  const { gl } = useThree();
  const [map, normalMap, roughnessMap] = useTexture([...GRASS_URLS]);

  useLayoutEffect(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    for (const tex of [map, normalMap, roughnessMap]) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      tex.anisotropy = aniso;
      tex.colorSpace =
        tex === map ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
      tex.needsUpdate = true;
    }
  }, [gl, map, normalMap, roughnessMap, repeat]);

  return { map, normalMap, roughnessMap };
}

useTexture.preload([...GRASS_URLS]);
