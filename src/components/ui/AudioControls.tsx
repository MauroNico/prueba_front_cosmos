import { useEffect, useId, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Waves } from 'lucide-react';
import { CONTENT } from '../../content';
import { sharedAudioEngine } from '../../lib/audioEngine';
import { transientLabState, useLabStore } from '../../store/useLabStore';

export function AudioControls() {
  const volumeSliderId = useId();
  const audioEnabled = useLabStore((s) => s.audioEnabled);
  const audioMuted = useLabStore((s) => s.audioMuted);
  const audioVolume = useLabStore((s) => s.audioVolume);
  const micEnabled = useLabStore((s) => s.micEnabled);
  const micError = useLabStore((s) => s.micError);

  const setAudioEnabled = useLabStore((s) => s.setAudioEnabled);
  const setAudioMuted = useLabStore((s) => s.setAudioMuted);
  const setAudioVolume = useLabStore((s) => s.setAudioVolume);
  const setMicEnabled = useLabStore((s) => s.setMicEnabled);
  const setMicError = useLabStore((s) => s.setMicError);

  const bassBarRef = useRef<HTMLDivElement>(null);
  const midBarRef = useRef<HTMLDivElement>(null);
  const trebleBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMeter = () => {
      const b = transientLabState.audioBands;
      if (bassBarRef.current) {
        bassBarRef.current.style.transform = `scaleY(${Math.max(0.12, Math.min(1, b.bass)).toFixed(2)})`;
      }
      if (midBarRef.current) {
        midBarRef.current.style.transform = `scaleY(${Math.max(0.12, Math.min(1, b.mid)).toFixed(2)})`;
      }
      if (trebleBarRef.current) {
        trebleBarRef.current.style.transform = `scaleY(${Math.max(0.12, Math.min(1, b.treble)).toFixed(2)})`;
      }
    };
    const id = window.setInterval(updateMeter, 80);
    return () => window.clearInterval(id);
  }, []);

  const handleActivateAudio = async () => {
    const ok = await sharedAudioEngine.start();
    if (ok) {
      setAudioEnabled(true);
      setAudioMuted(false);
      sharedAudioEngine.setMuted(false);
    }
  };

  const handleToggleMute = async () => {
    if (!audioEnabled) {
      await handleActivateAudio();
      return;
    }
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    sharedAudioEngine.setMuted(nextMuted);
  };

  const handleVolumeChange = (value: number) => {
    setAudioVolume(value);
    sharedAudioEngine.setVolume(value);
    if (value > 0 && audioMuted) {
      setAudioMuted(false);
      sharedAudioEngine.setMuted(false);
    }
  };

  const handleToggleMic = async () => {
    const nextMic = !micEnabled;
    if (nextMic) {
      setMicError(false);
      const ok = await sharedAudioEngine.setMicrophoneEnabled(true);
      if (ok) {
        setAudioEnabled(true);
        setMicEnabled(true);
      } else {
        setMicEnabled(false);
        setMicError(true);
      }
    } else {
      await sharedAudioEngine.setMicrophoneEnabled(false);
      setMicEnabled(false);
    }
  };

  return (
    <div
      role="group"
      aria-label={CONTENT.accessibility.audioGroup}
      className="instrument-panel pointer-events-auto flex flex-wrap items-center gap-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-3 py-1.5 backdrop-blur-md"
    >
      {!audioEnabled ? (
        <button
          type="button"
          onClick={handleActivateAudio}
          className="interactive-target font-telemetry inline-flex items-center gap-1.5 rounded border border-[var(--color-accent-warm)] bg-[var(--color-void-elevated)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.15em] text-[var(--color-accent-warm)] uppercase hover:bg-[var(--color-accent-warm)] hover:text-[var(--color-void)]"
        >
          <Waves aria-hidden="true" className="h-3.5 w-3.5" />
          <span>{CONTENT.audio.activateCta}</span>
        </button>
      ) : (
        <span className="font-telemetry flex items-center gap-1.5 text-[10px] tracking-[0.16em] text-[var(--color-accent-cyan)] uppercase">
          <Waves aria-hidden="true" className="h-3.5 w-3.5" />
          <span>{micEnabled ? CONTENT.audio.micActiveLabel : CONTENT.audio.activeLabel}</span>
        </span>
      )}

      {/* Always visible Mute / Unmute button */}
      <button
        type="button"
        aria-label={audioMuted || !audioEnabled ? CONTENT.accessibility.unmuteAudio : CONTENT.accessibility.muteAudio}
        aria-pressed={audioMuted}
        onClick={handleToggleMute}
        className="interactive-target font-telemetry inline-flex items-center gap-1 rounded border border-[var(--color-border-subtle)] px-2 py-1 text-[10px] tracking-[0.14em] text-[var(--color-text-primary)] uppercase hover:border-[var(--color-accent-cyan)]"
      >
        {audioMuted || !audioEnabled ? (
          <VolumeX aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-warm)]" />
        ) : (
          <Volume2 aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-cyan)]" />
        )}
        <span>{audioMuted ? CONTENT.audio.mutedLabel : `${Math.round(audioVolume * 100)}%`}</span>
      </button>

      {/* Accessible Volume Slider with explicit label for/id */}
      <div className="flex items-center gap-1.5">
        <label htmlFor={volumeSliderId} className="visually-hidden">
          {CONTENT.accessibility.volumeLabel}
        </label>
        <input
          id={volumeSliderId}
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={audioVolume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="h-1.5 w-16 cursor-pointer accent-[var(--color-accent-cyan)]"
        />
      </div>

      {/* Optional Microphone Input button */}
      <button
        type="button"
        aria-pressed={micEnabled}
        onClick={handleToggleMic}
        className="interactive-target font-telemetry inline-flex items-center gap-1 rounded border border-[var(--color-border-subtle)] px-2 py-1 text-[10px] tracking-[0.14em] text-[var(--color-text-secondary)] uppercase hover:border-[var(--color-accent-cyan)] hover:text-[var(--color-text-primary)]"
      >
        {micEnabled ? (
          <Mic aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-warm)]" />
        ) : (
          <MicOff aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
        )}
        <span className="hidden sm:inline">
          {micEnabled ? CONTENT.accessibility.disableMic : CONTENT.accessibility.enableMic}
        </span>
      </button>

      {/* 3-Band FFT Spectrum Mini Indicator (Bass / Mid / Treble) */}
      <div
        aria-hidden="true"
        className="flex h-4 items-end gap-1 border-l border-[var(--color-border-subtle)] pl-2"
        title={CONTENT.hud.audioSpectrumLabel}
      >
        <div
          ref={bassBarRef}
          className="h-full w-1 origin-bottom rounded-xs bg-[var(--color-accent-warm)]"
          style={{ transform: 'scaleY(0.15)' }}
        />
        <div
          ref={midBarRef}
          className="h-full w-1 origin-bottom rounded-xs bg-[var(--color-accent-cyan)]"
          style={{ transform: 'scaleY(0.15)' }}
        />
        <div
          ref={trebleBarRef}
          className="h-full w-1 origin-bottom rounded-xs bg-[var(--color-text-primary)]"
          style={{ transform: 'scaleY(0.15)' }}
        />
      </div>

      {micError && (
        <span
          role="status"
          className="font-telemetry text-[10px] text-[var(--color-accent-warm)]"
        >
          {CONTENT.audio.micDeniedNotice}
        </span>
      )}
    </div>
  );
}
