import { audio } from "../audio/audio";
import { useMuted } from "../audio/useMuted";

interface Props {
  className?: string;
}

export function MuteToggle({ className = "" }: Props) {
  const muted = useMuted();
  return (
    <button
      type="button"
      className={`hw-mute-toggle ${className}`}
      onClick={() => audio.toggleMuted()}
      aria-label={muted ? "Geluid aan" : "Geluid uit"}
      title={muted ? "Geluid aan" : "Geluid uit"}
    >
      {muted ? <MutedIcon /> : <SoundIcon />}
    </button>
  );
}

function SoundIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
      />
      <path
        d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7 7 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path
        d="M16 9l5 6M21 9l-5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
