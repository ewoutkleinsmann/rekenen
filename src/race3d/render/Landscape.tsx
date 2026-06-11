import { Terrain } from "./Terrain";
import { TrackSurroundings } from "./TrackSurroundings";
import { Track3D } from "./Track3D";
import type { Track3D as Track3DData } from "../sim/buildTrack3d";

interface Props {
  track: Track3DData;
  groundY: number;
}

/** Terrain, track mesh, trees and props (textures load via Suspense). */
export function Landscape({ track, groundY }: Props) {
  const cx = (track.bounds.min[0] + track.bounds.max[0]) / 2;
  const cz = (track.bounds.min[2] + track.bounds.max[2]) / 2;

  return (
    <group>
      <Terrain track={track} cx={cx} cz={cz} baseY={groundY} />
      <Track3D track={track} />
      <TrackSurroundings track={track} groundY={groundY} />
    </group>
  );
}
