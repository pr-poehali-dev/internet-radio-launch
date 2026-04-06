import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_TRACKS = "https://functions.poehali.dev/7739cea2-545f-478e-af74-15d4eb671e08";

interface Track {
  id: string;
  title: string;
  url: string;
  uploaded_at: number;
  size: number;
}

const TEAM = [
  { name: "Алекс Волков", role: "Главный диджей", emoji: "🎧" },
  { name: "Мария Соль", role: "Ведущая утреннего шоу", emoji: "🌅" },
  { name: "Денис Нова", role: "Музыкальный редактор", emoji: "🎵" },
];

const STATS = [
  { value: "24/7", label: "В эфире" },
  { value: "128k+", label: "Слушателей" },
  { value: "320", label: "kbps качество" },
  { value: "2019", label: "Год основания" },
];

export default function Index() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks[currentIndex] || null;

  useEffect(() => {
    fetch(API_TRACKS)
      .then(r => r.json())
      .then(d => setTracks(d.tracks || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => {
        nextTrack();
      });
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0);
      });
    }
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const playTrack = useCallback(async (index: number) => {
    if (!audioRef.current || tracks.length === 0) return;
    const track = tracks[index];
    if (!track) return;

    setCurrentIndex(index);
    setLoading(true);
    audioRef.current.src = track.url;

    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }, [tracks]);

  const togglePlay = async () => {
    if (!audioRef.current || tracks.length === 0) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        await playTrack(0);
      } else {
        setLoading(true);
        try {
          await audioRef.current.play();
          setPlaying(true);
        } catch {
          setPlaying(false);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const next = (currentIndex + 1) % tracks.length;
    playTrack(next);
  }, [currentIndex, tracks, playTrack]);

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const prev = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    playTrack(prev);
  };

  useEffect(() => {
    if (audioRef.current) {
      const el = audioRef.current;
      const onEnded = () => nextTrack();
      el.addEventListener("ended", onEnded);
      return () => el.removeEventListener("ended", onEnded);
    }
  }, [nextTrack]);

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen font-body" style={{ background: "var(--bg-dark)" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(7,7,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="font-display text-2xl font-bold tracking-widest gradient-text">ПУЛЬС</div>
        <div className="flex gap-6 text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
          <button onClick={() => scrollTo("player")} className="hover:text-white transition-colors">Плеер</button>
          <button onClick={() => scrollTo("about")} className="hover:text-white transition-colors">О нас</button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.3)" }}>
          <span className="live-dot w-2 h-2 rounded-full" style={{ background: "var(--neon-pink)" }}></span>
          <span style={{ color: "var(--neon-pink)" }}>В ЭФИРЕ</span>
        </div>
      </nav>

      {/* HERO + PLAYER */}
      <section id="player" className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl orbit-gradient"
            style={{ background: "radial-gradient(circle, #ff2d78, transparent)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #00f5ff, transparent)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-10 blur-2xl"
            style={{ background: "radial-gradient(circle, #b84fff, transparent)" }} />
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl w-full">
          <div className="fade-in-up fade-in-up-d1 mb-6">
            <div className="font-display text-7xl md:text-9xl font-bold tracking-widest gradient-text leading-none">ПУЛЬС</div>
            <div className="text-sm tracking-[0.5em] mt-2 uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Онлайн Радио</div>
          </div>

          {/* Current track */}
          <div className="fade-in-up fade-in-up-d2 flex items-center gap-3 mb-10 px-5 py-2.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="Music" size={14} className="opacity-60" />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              {currentTrack ? currentTrack.title : (tracks.length ? "Нажми Play" : "Нет треков")}
            </span>
          </div>

          {/* Player card */}
          <div className="fade-in-up fade-in-up-d3 w-full max-w-md p-8 rounded-3xl card-glow">
            {/* Waveform */}
            <div className="flex items-end justify-center gap-1.5 mb-6 h-12">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i}
                  className={`wave-bar rounded-full ${!playing ? "wave-bar-paused" : ""}`}
                  style={{
                    width: "4px",
                    height: i % 3 === 0 ? "30px" : i % 2 === 0 ? "20px" : "12px",
                    background: i < 9
                      ? "linear-gradient(to top, var(--neon-pink), var(--neon-purple))"
                      : "linear-gradient(to top, var(--neon-purple), var(--neon-cyan))",
                    opacity: playing ? 1 : 0.3,
                  }} />
              ))}
            </div>

            {/* Progress bar */}
            {duration > 0 && (
              <div className="mb-6">
                <div className="h-1 rounded-full cursor-pointer" style={{ background: "rgba(255,255,255,0.1)" }} onClick={seekTo}>
                  <div className="h-full rounded-full" style={{
                    width: `${(currentTime / duration) * 100}%`,
                    background: "linear-gradient(90deg, var(--neon-pink), var(--neon-purple))"
                  }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{formatTime(currentTime)}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button onClick={prevTrack} className="p-2 transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Icon name="SkipBack" size={22} />
              </button>

              <div className="relative">
                {playing && (
                  <>
                    <div className="pulse-ring absolute inset-0 rounded-full" style={{ border: "2px solid var(--neon-pink)" }} />
                    <div className="pulse-ring2 absolute inset-0 rounded-full" style={{ border: "2px solid var(--neon-purple)" }} />
                  </>
                )}
                <button onClick={togglePlay}
                  className="glow-btn relative w-20 h-20 rounded-full flex items-center justify-center text-white"
                  style={{ background: "linear-gradient(135deg, var(--neon-pink), var(--neon-purple))" }}>
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name={playing ? "Pause" : "Play"} size={28} />
                  )}
                </button>
              </div>

              <button onClick={nextTrack} className="p-2 transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Icon name="SkipForward" size={22} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <Icon name="Volume2" size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
              <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="flex-1" />
              <span className="text-xs w-8 text-right" style={{ color: "rgba(255,255,255,0.4)" }}>{volume}%</span>
            </div>
          </div>

          {/* Playlist */}
          {tracks.length > 0 && (
            <div className="fade-in-up fade-in-up-d4 w-full max-w-md mt-6 card-glow rounded-2xl overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-xs font-display font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>ПЛЕЙЛИСТ</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{tracks.length} треков</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {tracks.map((track, i) => (
                  <button key={track.id} onClick={() => playTrack(i)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: i === currentIndex ? "rgba(255,45,120,0.08)" : "transparent" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: i === currentIndex ? "rgba(255,45,120,0.2)" : "rgba(255,255,255,0.05)" }}>
                      {i === currentIndex && playing ? (
                        <Icon name="Pause" size={12} style={{ color: "var(--neon-pink)" }} />
                      ) : (
                        <Icon name="Play" size={12} style={{ color: i === currentIndex ? "var(--neon-pink)" : "rgba(255,255,255,0.3)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: i === currentIndex ? "var(--neon-pink)" : "rgba(255,255,255,0.7)" }}>{track.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="fade-in-up fade-in-up-d4 grid grid-cols-4 gap-4 mt-10 w-full max-w-md">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <div className="font-display text-xl font-bold" style={{ color: "var(--neon-cyan)" }}>{s.value}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => scrollTo("about")}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
          <span className="text-xs tracking-widest uppercase">Узнать больше</span>
          <Icon name="ChevronDown" size={16} />
        </button>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="font-display text-5xl md:text-6xl font-bold mb-4 gradient-text">О НАС</div>
            <div className="max-w-xl mx-auto text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Мы — команда музыкальных энтузиастов, которые верят, что настоящий звук меняет настроение и вдохновляет
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="card-glow p-8 rounded-2xl">
              <div className="text-3xl mb-4">📡</div>
              <div className="font-display text-xl font-semibold mb-3" style={{ color: "var(--neon-cyan)" }}>Наша миссия</div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Радиостанция ПУЛЬС вещает 24 часа в сутки, 7 дней в неделю. Мы транслируем электронную музыку,
                хаус, техно и экспериментальные жанры — живой звук без фильтров и компромиссов.
              </p>
            </div>
            <div className="card-glow p-8 rounded-2xl">
              <div className="text-3xl mb-4">🎚️</div>
              <div className="font-display text-xl font-semibold mb-3" style={{ color: "var(--neon-purple)" }}>Технологии</div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Поддерживаем MP3, AAC и HLS потоки с качеством до 320 kbps. Наш сервер обрабатывает тысячи
                одновременных подключений, гарантируя стабильный сигнал в любой точке мира.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="font-display text-2xl font-bold mb-8 text-center tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>КОМАНДА</div>
            <div className="grid md:grid-cols-3 gap-5">
              {TEAM.map(m => (
                <div key={m.name} className="card-glow p-6 rounded-2xl text-center group cursor-default">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{m.emoji}</div>
                  <div className="font-display text-lg font-semibold mb-1">{m.name}</div>
                  <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{m.role}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-16">
            <button onClick={() => scrollTo("player")}
              className="glow-btn flex items-center gap-3 px-8 py-4 rounded-full font-display font-semibold tracking-widest text-white"
              style={{ background: "linear-gradient(135deg, var(--neon-pink), var(--neon-purple))" }}>
              <Icon name="Radio" size={18} />
              СЛУШАТЬ ЭФИР
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="font-display text-lg font-bold tracking-widest gradient-text mb-2">ПУЛЬС</div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>© 2024 Радио ПУЛЬС. Все права защищены.</div>
      </footer>
    </div>
  );
}
