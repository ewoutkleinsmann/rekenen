# 3D auto-modellen

De 3D-race rendert standaard een **procedureel** low-poly raceauto (zie
`src/race3d/render/ProceduralCar.tsx`). Die heeft losse, draaiende en sturende
wielen en wordt per auto ingekleurd op basis van `carModels.ts`.

## Eigen GLTF/GLB-model gebruiken

Wil je een echt 3D-model gebruiken (bijv. een CC0-model van kenney.nl of
Khronos glTF-Sample-Assets)? Doe dit:

1. Zet het `.glb`-bestand in deze map, bijv. `public/assets/cars3d/grip-gt.glb`.
2. Voeg in `src/race3d/render/carModels.ts` een `glb`-pad toe aan de betreffende
   auto, bijvoorbeeld:

   ```ts
   "grip-gt": { color: "#23d18b", accent: "#0b3d2e", glb: "/assets/cars3d/grip-gt.glb" },
   ```

3. `CarModel` laadt het model dan via `useGLTF` in plaats van de procedurele
   auto. Het model wordt automatisch geschaald naar de standaard auto-lengte.

GLB-modellen worden bij voorkeur klein gehouden (< ~500 KB) en met de neus
richting `-Z` geexporteerd.
