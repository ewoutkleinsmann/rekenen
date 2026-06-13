# 3D auto-modellen (GLB)

Elke speelbare auto heeft een **GLB** in `src/race3d/render/carModels.ts`.
Zonder entry valt de race terug op een procedurele low-poly auto.

## Auto-bestanden

| Bestand | Auto (id) |
| --- | --- |
| `booster-blaze.glb` | Booster Blaze |
| `sol-aire_cx4.glb` | Jump Jet |
| `free_hot_wheels_acceleracers_-_rd02.glb` | Loop King |
| `free_hot_wheels_acceleracers_-_rat-ified.glb` | Grip GT |
| `hot_wheels_rocket-bye-baby_1970_redline_scan.glb` | Rocket Racer |
| `boneshaker.glb` | Bone Shaker |
| `hot_wheels_-_splittin_image_2.glb` | Splittin' Image |
| `hot_wheels_bone_shaker.glb` | Shaker Hammer |

## Omgeving

| Bestand | Gebruik |
| --- | --- |
| `low-poly_city_buildings.glb` | Skyline rond de baan (`CityBuildings.tsx`) |

Zet nieuwe modellen in `public/assets/cars3d/` (statisch op `/assets/cars3d/…`).

## Export

- Neus van de auto naar **−Z** (Three.js forward), of zet `rotationY: Math.PI` in `carModels.ts`.
- Schaal maakt niet uit: `prepareGlbScene()` schaalt auto’s naar `CAR_LENGTH` (4 eenheden).
- Gebouwen worden apart geschaald in `CityBuildings.tsx`.

Liever compacte GLB’s (< ~2 MB per auto) voor schooldevices; grote scans werken maar laden trager.
