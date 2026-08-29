import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  trackTitle: string;
  autoPlayTriggered: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  trackTitle,
  autoPlayTriggered,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      setHasError(false);
      
      if (autoPlayTriggered) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Autoplay blocked or audio load error:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [audioUrl, autoPlayTriggered]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasError(false);
        })
        .catch((err) => {
          console.error('Play error:', err);
          setHasError(true);
        });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-night text-silver-light p-2 pl-4 pr-3 rounded-full shadow-lg border border-plumbago-light transition-all duration-300 hover:border-silver">
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onError={() => setHasError(true)}
      />

      {/* Track Label and Soundwave indicator */}
      <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-plumbago-light">
        <Music className={`w-3.5 h-3.5 text-silver ${isPlaying ? 'animate-bounce' : ''}`} />
        <span className="text-[10px] uppercase tracking-wider font-medium max-w-[130px] truncate text-silver-light">
          {trackTitle || 'Reproducir Música'}
        </span>
      </div>

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pausar música' : 'Reproducir música'}
        className="w-8 h-8 rounded-full border border-silver bg-silver text-night-soft hover:bg-silver-dark hover:border-silver-dark flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 text-night-soft fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 text-night-soft fill-current translate-x-0.5" />
        )}
      </button>

      {/* Mute/Unmute Button */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
        className="p-1.5 text-silver-dark hover:text-silver-light transition-colors cursor-pointer"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-amber-700" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      {hasError && (
        <span className="text-[9px] uppercase tracking-wider text-amber-700 pl-1">Sin audio</span>
      )}
    </div>
  );
};
