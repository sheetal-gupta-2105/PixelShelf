import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Star, ImagePlus, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCozy, MediaType, MediaStatus } from "@/store/cozyStore";
import { toast } from "@/hooks/use-toast";

interface AddMediaModalProps {
  open: boolean;
  onClose: () => void;
  defaultCollection?: string;
}

const TYPES: MediaType[] = ["anime", "manga", "movie", "show", "game", "book"];
const STATUSES: MediaStatus[] = ["watching", "reading", "playing", "completed", "planned", "paused", "dropped"];

export function AddMediaModal({ open, onClose, defaultCollection }: AddMediaModalProps) {
  const { state, addMedia } = useCozy();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("anime");
  const [status, setStatus] = useState<MediaStatus>("watching");
  const [rating, setRating] = useState(4);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Cozy"]);
  const [collection, setCollection] = useState("");
  const [notes, setNotes] = useState("");
  const [poster, setPoster] = useState("");
  const [favoriteEpisode, setFavoriteEpisode] = useState("");
  const [favoriteCharacter, setFavoriteCharacter] = useState("");
  const [errors, setErrors] = useState<{ title?: string }>({});

  // Reset on open
  useEffect(() => {
    if (open) {
      setTitle("");
      setType("anime");
      setStatus("watching");
      setRating(4);
      setSelectedTags(["Cozy"]);
      setCollection(defaultCollection ?? "");
      setNotes("");
      setPoster("");
      setFavoriteEpisode("");
      setFavoriteCharacter("");
      setErrors({});
    }
  }, [open, defaultCollection]);

  // Lock body scroll while open (no layout shift via scrollbar-gutter on html)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handlePosterFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPoster(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setErrors({ title: "Give your entry a title" });
      return;
    }
    addMedia({
      title: trimmed,
      type,
      status,
      rating,
      tags: selectedTags,
      collection,
      notes,
      poster,
      favoriteEpisode,
      favoriteCharacter,
      progress: status === "watching" || status === "reading" || status === "playing" ? 0 : undefined,
    });
    toast({ title: "Added to library ✨", description: `${trimmed} is now in your shelf.` });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] grid place-items-center p-4 bg-background/80 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl pixel-card p-0 overflow-hidden animate-scale-in glow-primary"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-pixel-border bg-surface relative">
          <div>
            <p className="text-[10px] font-pixel uppercase tracking-[0.2em] text-secondary">
              ✦ new entry ✦
            </p>
            <h2 className="font-pixel text-2xl text-foreground mt-0.5">Add to Library</h2>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-sm border-2 border-pixel-border bg-card text-muted-foreground hover:text-primary hover:border-primary/60 press-down"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Poster upload */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">Poster</label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handlePosterFile(e.dataTransfer.files?.[0]);
              }}
              className="mt-2 grid grid-cols-[96px_1fr] gap-4 rounded-sm border-2 border-dashed border-pixel-border bg-background/70 p-3 hover:border-primary/50 transition-colors"
            >
              <div className="h-32 w-24 overflow-hidden rounded-sm border-2 border-pixel-border bg-card grid place-items-center">
                {poster ? <img src={poster} alt="Poster preview" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="flex flex-col justify-center gap-3">
                <p className="text-sm text-foreground">Drop a poster image here, or choose one from your device.</p>
                <label className="h-10 w-fit px-4 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 font-pixel tracking-wide text-sm press-down hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.7)] inline-flex items-center gap-2 cursor-pointer">
                  <UploadCloud className="h-4 w-4" /> Upload Poster
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => handlePosterFile(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({});
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="e.g. Stardust Drifters"
              className={cn(
                "mt-2 w-full h-11 px-3 rounded-sm bg-background border-2 text-sm focus:outline-none transition-all",
                errors.title
                  ? "border-destructive focus:border-destructive"
                  : "border-pixel-border focus:border-primary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
                Type <span className="text-destructive">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MediaType)}
                className="mt-2 w-full h-11 px-3 rounded-sm bg-background border-2 border-pixel-border text-sm focus:outline-none focus:border-primary/60 capitalize"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MediaStatus)}
                className="mt-2 w-full h-11 px-3 rounded-sm bg-background border-2 border-pixel-border text-sm focus:outline-none focus:border-primary/60 capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              Rating
            </label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className="h-10 w-10 grid place-items-center rounded-sm border-2 border-pixel-border bg-card press-down hover:border-primary/40 transition-colors"
                  aria-label={`Rate ${n}`}
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-all",
                      n <= rating
                        ? "fill-secondary text-secondary drop-shadow-[0_0_6px_hsl(var(--secondary)/0.7)]"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
              <span className="ml-3 font-pixel text-sm text-foreground">{rating}.0 / 5</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              Tags
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {state.ui.tags.map((t) => {
                const active = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "px-3 h-8 rounded-sm border-2 text-xs font-medium press-down transition-all",
                      active
                        ? "bg-primary/15 border-primary/60 text-primary"
                        : "bg-card border-pixel-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active && <span className="mr-1">✓</span>}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collection */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              Collection
            </label>
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="mt-2 w-full h-11 px-3 rounded-sm bg-background border-2 border-pixel-border text-sm focus:outline-none focus:border-primary/60"
            >
              <option value="">— None —</option>
              {state.collections.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Personal favorites */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">⭐ Favorite Episode</label>
              <input
                value={favoriteEpisode}
                onChange={(e) => setFavoriteEpisode(e.target.value)}
                placeholder="Episode, chapter, quest…"
                className="mt-2 w-full h-11 px-3 rounded-sm bg-background border-2 border-pixel-border text-sm focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">🎭 Favorite Character</label>
              <input
                value={favoriteCharacter}
                onChange={(e) => setFavoriteCharacter(e.target.value)}
                placeholder="The one who stayed with you"
                className="mt-2 w-full h-11 px-3 rounded-sm bg-background border-2 border-pixel-border text-sm focus:outline-none focus:border-primary/60"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              Notes / Log
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="A quiet thought, a favorite scene…"
              className="mt-2 w-full px-3 py-2 rounded-sm bg-background border-2 border-pixel-border text-sm focus:outline-none focus:border-primary/60 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-pixel-border bg-surface">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-sm border-2 border-pixel-border bg-card text-sm text-muted-foreground hover:text-foreground press-down font-pixel tracking-wide"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-6 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 font-pixel tracking-wide text-sm press-down hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)] transition-shadow"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
