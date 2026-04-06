import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const API_UPLOAD = "https://functions.poehali.dev/8aa427b5-b798-4fb5-bb19-69b777a50411";
const API_TRACKS = "https://functions.poehali.dev/7739cea2-545f-478e-af74-15d4eb671e08";
const API_DELETE = "https://functions.poehali.dev/71ccf556-6fac-48af-a8e3-8768e5e09db6";

interface Track {
  id: string;
  title: string;
  filename: string;
  url: string;
  uploaded_at: number;
  size: number;
}

export default function Upload() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const login = async () => {
    setError("");
    try {
      const res = await fetch(API_TRACKS);
      const data = await res.json();
      setTracks(data.tracks || []);
      setAuthed(true);
    } catch {
      setError("Ошибка подключения");
    }
  };

  const loadTracks = async () => {
    const res = await fetch(API_TRACKS);
    const data = await res.json();
    setTracks(data.tracks || []);
  };

  const uploadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".mp3")) {
      setError("Только MP3 файлы");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 30 МБ)");
      return;
    }

    setUploading(true);
    setError("");
    setProgress("Читаю файл...");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setProgress("Загружаю на сервер...");

      try {
        const res = await fetch(API_UPLOAD, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            file: base64,
            filename: file.name,
            title: file.name.replace(".mp3", "").replace(/[_-]/g, " "),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Ошибка загрузки");
        } else {
          setProgress("Готово!");
          await loadTracks();
        }
      } catch {
        setError("Ошибка сети");
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(""), 2000);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteTrack = async (trackId: string) => {
    if (!confirm("Удалить трек?")) return;
    try {
      const res = await fetch(API_DELETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, track_id: trackId }),
      });
      if (res.ok) {
        await loadTracks();
      }
    } catch {
      setError("Ошибка удаления");
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + " МБ";
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 font-body" style={{ background: "var(--bg-dark)" }}>
        <div className="w-full max-w-sm card-glow p-8 rounded-3xl text-center">
          <div className="font-display text-3xl font-bold gradient-text mb-2">ПУЛЬС</div>
          <div className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>Панель загрузки треков</div>

          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 mb-4 outline-none focus:ring-2"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", focusRingColor: "var(--neon-pink)" }}
          />

          {error && <div className="text-sm mb-4" style={{ color: "var(--neon-pink)" }}>{error}</div>}

          <button onClick={login}
            className="glow-btn w-full py-3 rounded-xl font-display font-semibold tracking-wider text-white"
            style={{ background: "linear-gradient(135deg, var(--neon-pink), var(--neon-purple))" }}>
            ВОЙТИ
          </button>

          <a href="/" className="block mt-6 text-xs hover:underline" style={{ color: "rgba(255,255,255,0.3)" }}>
            ← На главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 font-body" style={{ background: "var(--bg-dark)" }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-display text-2xl font-bold gradient-text">ЗАГРУЗКА</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{tracks.length} треков загружено</div>
          </div>
          <a href="/" className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
            <Icon name="Radio" size={14} />
            К плееру
          </a>
        </div>

        {/* Upload area */}
        <div
          className="card-glow rounded-2xl p-8 text-center mb-6 cursor-pointer transition-all hover:border-neon-pink/30"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".mp3,audio/mpeg"
            className="hidden"
            onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--neon-pink)", borderTopColor: "transparent" }} />
              <div className="text-sm" style={{ color: "var(--neon-cyan)" }}>{progress}</div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.1)" }}>
                <Icon name="Upload" size={28} style={{ color: "var(--neon-pink)" }} />
              </div>
              <div className="font-display text-lg font-semibold mb-1 text-white">Загрузить MP3</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Нажми или перетащи файл (до 30 МБ)</div>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,45,120,0.1)", color: "var(--neon-pink)" }}>
            {error}
          </div>
        )}

        {/* Track list */}
        <div className="space-y-2">
          {tracks.map(track => (
            <div key={track.id} className="card-glow rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,245,255,0.1)" }}>
                <Icon name="Music" size={14} style={{ color: "var(--neon-cyan)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{track.title}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{formatSize(track.size)}</div>
              </div>
              <button onClick={() => deleteTrack(track.id)}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          ))}

          {tracks.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>
              Нет загруженных треков
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
