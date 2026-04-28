import { X, Star, Trash2, UploadCloud, ImagePlus, BookOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { MediaItem, MediaStatus, MediaType, useCozy } from "@/store/cozyStore";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  item: MediaItem | null;
  onClose: () => void;
}

const STATUSES: MediaStatus[] = ["watching", "reading", "playing", "completed", "planned", "paused", "dropped"];

// Media types that track discrete units (episodes/chapters) vs % completion
const UNIT_LABEL: Partial<Record<MediaType, { unit: string; total: string }>> = {
  anime: { unit: "Episode", total: "Episodes" },
  show: { unit: "Episode", total: "Episodes" },
  manga: { unit: "Chapter", total: "Chapters" },
  book: { unit: "Page", total: "Pages" },
};

export function MediaDetailModal({ item, onClose }: Props) {
  const { updateMedia, softDeleteMedia, restoreMedia, state } = useCozy();
  const [draft, setDraft] = useState<MediaItem | null>(item);
  const [progressMode, setProgressMode] = useState<"units" | "percent">("percent");
  const [unitCurrent, setUnitCurrent] = useState<number>(0);
  const [unitTotal, setUnitTotal] = useState<number>(12);
  const [pulsedStar, setPulsedStar] = useState<number | null>(null);
  const [savingFlash, setSavingFlash] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Reset draft when item changes
  useEffect(() => {
    setDraft(item);
    isFirstLoad.current = true;
    if (item) {
      const supportsUnits = !!UNIT_LABEL[item.type];
      setProgressMode(supportsUnits ? "units" : "percent");
      // derive unit values from progress %
      const defaults = item.type === "manga" ? 24 : item.type === "book" ? 300 : 12;
      setUnitTotal(defaults);
      setUnitCurrent(Math.round(((item.progress ?? 0) / 100) * defaults));
    }
  }, [item]);

  // Auto-save draft (debounced) — feels like writing in a journal
  useEffect(() => {
    if (!draft || !item) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (draft.title.trim()) {
        updateMedia(draft);
        setSavingFlash((n) => n + 1);
      }
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, item, updateMedia]);

  // Close on Escape
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  const supportsUnits = useMemo(() => (item ? !!UNIT_LABEL[item.type] : false), [item]);

  if (!item || !draft) return null;

  const handlePosterFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setDraft({ ...draft, poster: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const updateUnits = (current: number, total: number) => {
    setUnitCurrent(current);
    setUnitTotal(total);
    const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;
    setDraft({ ...draft, progress: pct });
  };

  const remove = () => {
    setConfirmRemove(true);
  };

  const confirmSoftDelete = () => {
    if (!item) return;
    const id = item.id;
    const title = item.title;
    softDeleteMedia(id);
    toast({
      title: "Moved to Trash",
      description: `${title} can be restored from Trash.`,
      action: (
        <button
          onClick={() => {
            restoreMedia(id);
            toast({ title: "Restored ✦", description: `${title} is back on your shelf.` });
          }}
          className="h-8 px-3 rounded-sm border-2 border-primary/60 bg-primary/15 text-primary text-xs font-pixel tracking-wide press-down hover:bg-primary/25"
        >
          Undo
        </button>
      ) as any,
    });
    setConfirmRemove(false);
    onClose();
  };

  const toggleTag = (tag: string) => {
    const has = draft.tags.includes(tag);
    setDraft({ ...draft, tags: has ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag] });
  };

  const unitLabels = UNIT_LABEL[draft.type] ?? { unit: "Unit", total: "Total" };
  const updatedLabel = new Date(draft.updatedAt ?? draft.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-background/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center p-4 md:p-8">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl rounded-md border-2 border-pixel-border bg-card shadow-[0_8px_0_-2px_hsl(var(--background)),0_0_60px_-10px_hsl(var(--primary)/0.25)] animate-scale-in overflow-hidden"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 h-12 border-b-2 border-pixel-border bg-surface/60">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4 text-secondary" />
              <span className="font-pixel text-[11px] tracking-[0.25em] uppercase">Journal Entry</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] font-pixel uppercase tracking-widest text-muted-foreground">
                Last entry · {updatedLabel}
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="h-8 w-8 grid place-items-center rounded-sm border-2 border-pixel-border bg-card/90 text-muted-foreground hover:text-primary hover:border-primary/60 press-down"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-[260px_1fr] gap-0">
            {/* LEFT — Poster */}
            <aside className="p-6 md:p-7 md:border-r-2 border-pixel-border bg-surface/30">
              <div className="md:sticky md:top-6 space-y-4">
              <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handlePosterFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "group relative block aspect-[2/3] rounded-md border-[3px] border-primary/30 overflow-hidden cursor-pointer",
                    "shadow-[0_0_0_2px_hsl(var(--background)),0_0_44px_-4px_hsl(var(--primary)/0.55),0_0_80px_-12px_hsl(var(--secondary)/0.35)]",
                    "transition-all duration-300 hover:shadow-[0_0_0_2px_hsl(var(--background)),0_0_60px_-2px_hsl(var(--primary)/0.7),0_0_110px_-12px_hsl(var(--secondary)/0.5)] hover:border-primary/60",
                    !draft.poster && draft.cover
                  )}
                >
                  {draft.poster ? (
                    <img src={draft.poster} alt={draft.title} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <ImagePlus className="h-10 w-10 text-foreground/40" />
                    </div>
                  )}
                  {/* gradient overlay for visual anchor */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-background/20" />
                  {/* pixel scanlines */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
                    style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.18) 2px 3px)" }}
                  />
                  {/* hover overlay */}
                  <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                    <div className="flex flex-col items-center gap-3 text-foreground">
                      <UploadCloud className="h-7 w-7 text-primary" />
                      <span className="font-pixel text-[11px] tracking-widest uppercase">Drop or click</span>
                      <span className="px-3 h-8 inline-flex items-center rounded-sm border-2 border-primary/60 bg-primary/15 text-primary font-pixel text-[11px] tracking-widest uppercase">
                        Change Poster
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handlePosterFile(e.target.files?.[0])}
                  />
                </label>

                {/* Quiet metadata under poster */}
                <div className="space-y-2 text-[11px] font-pixel uppercase tracking-widest">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Type</span>
                    <span className="text-foreground capitalize">{draft.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Collection</span>
                    <span className="text-foreground normal-case font-sans text-xs">{draft.collection || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Added</span>
                    <span className="text-foreground normal-case font-sans text-xs">
                      {new Date(draft.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT — Content */}
            <section className="p-6 md:p-8 space-y-7">
              {/* Title + type + status — anchored card */}
              <div className="rounded-md border-2 border-pixel-border bg-gradient-to-br from-surface/70 via-card/40 to-background/30 p-5 md:p-6 shadow-[inset_0_2px_10px_-4px_hsl(var(--background)),0_0_30px_-12px_hsl(var(--primary)/0.35)] space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 h-6 inline-flex items-center rounded-sm border-2 border-secondary/40 bg-secondary/10 text-secondary text-[10px] font-pixel uppercase tracking-widest">
                    {draft.type}
                  </span>
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value as MediaStatus })}
                    className="h-7 px-2 rounded-sm bg-background/60 border-2 border-pixel-border text-[11px] font-pixel uppercase tracking-widest capitalize text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                  {savingFlash > 0 && (
                    <span
                      key={savingFlash}
                      className="ml-auto text-[10px] font-pixel uppercase tracking-widest text-primary saving-indicator inline-flex items-center gap-1"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                      Saved
                    </span>
                  )}
                </div>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Untitled"
                  className="w-full bg-transparent font-pixel text-2xl md:text-3xl leading-tight text-foreground placeholder:text-muted-foreground/50 border-b-2 border-transparent focus:border-primary/40 focus:outline-none pb-1 transition-colors"
                />

                {/* Rating */}
                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setDraft({ ...draft, rating: draft.rating === n ? 0 : n });
                        setPulsedStar(n);
                        setTimeout(() => setPulsedStar(null), 450);
                      }}
                      className="h-8 w-8 grid place-items-center rounded-sm hover:bg-secondary/10 hover:shadow-[0_0_14px_-4px_hsl(var(--secondary)/0.7)] transition-all"
                      aria-label={`Rate ${n} stars`}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-all",
                          n <= draft.rating ? "fill-secondary text-secondary drop-shadow-[0_0_4px_hsl(var(--secondary)/0.6)]" : "text-muted-foreground/50",
                          pulsedStar === n && "star-pulse"
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-pixel uppercase tracking-widest text-muted-foreground">
                    {draft.rating ? `${draft.rating} / 5` : "Unrated"}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="rounded-md border-2 border-pixel-border bg-background/40 p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">Progress</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">Update progress as you go</p>
                  </div>
                  {supportsUnits && (
                    <div className="inline-flex rounded-sm border-2 border-pixel-border overflow-hidden text-[10px] font-pixel uppercase tracking-widest">
                      <button
                        onClick={() => setProgressMode("units")}
                        className={cn(
                          "px-2 h-6 transition-all",
                          progressMode === "units" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {unitLabels.unit}s
                      </button>
                      <button
                        onClick={() => setProgressMode("percent")}
                        className={cn(
                          "px-2 h-6 border-l-2 border-pixel-border transition-all",
                          progressMode === "percent" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        %
                      </button>
                    </div>
                  )}
                </div>

                {progressMode === "units" && supportsUnits ? (
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground mb-1">Current</p>
                      <input
                        type="number"
                        min={0}
                        max={unitTotal}
                        value={unitCurrent}
                        onChange={(e) => updateUnits(Math.max(0, Math.min(unitTotal, Number(e.target.value) || 0)), unitTotal)}
                        className="w-full h-10 px-3 rounded-sm bg-card border-2 border-pixel-border font-pixel text-lg text-foreground focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.18),0_0_18px_-4px_hsl(var(--primary)/0.5)] hover:border-primary/40 transition-all"
                      />
                    </div>
                    <span className="pb-2 font-pixel text-xl text-muted-foreground">/</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground mb-1">{unitLabels.total}</p>
                      <input
                        type="number"
                        min={1}
                        value={unitTotal}
                        onChange={(e) => updateUnits(unitCurrent, Math.max(1, Number(e.target.value) || 1))}
                        className="w-full h-10 px-3 rounded-sm bg-card border-2 border-pixel-border font-pixel text-lg text-foreground focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.18),0_0_18px_-4px_hsl(var(--primary)/0.5)] hover:border-primary/40 transition-all"
                      />
                    </div>
                    <div className="text-right pb-2 min-w-[50px]">
                      <p className="font-pixel text-sm text-primary">{draft.progress ?? 0}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={draft.progress ?? 0}
                      onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <div className="flex items-center justify-between text-[10px] font-pixel uppercase tracking-widest text-muted-foreground">
                      <span>0%</span>
                      <span className="text-primary">{draft.progress ?? 0}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* Visual progress bar */}
                <div className="h-1.5 rounded-sm bg-muted/50 overflow-hidden border border-pixel-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                    style={{ width: `${draft.progress ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Personal Journal — main focus */}
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-secondary">✦</span>
                  <h3 className="font-pixel text-sm uppercase tracking-[0.25em] text-foreground/80">Personal Journal</h3>
                  <div className="flex-1 h-px bg-pixel-border/60" />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block rounded-md border-2 border-pixel-border bg-background/60 p-4 shadow-[inset_0_2px_8px_-4px_hsl(var(--background))] focus-within:border-secondary/40 focus-within:shadow-[inset_0_2px_8px_-4px_hsl(var(--background)),0_0_18px_-6px_hsl(var(--secondary)/0.55)] transition-all">
                    <span className="block text-[10px] font-pixel uppercase tracking-widest text-muted-foreground mb-2">
                      🎭 Favorite Character
                    </span>
                    <input
                      value={draft.favoriteCharacter ?? ""}
                      onChange={(e) => setDraft({ ...draft, favoriteCharacter: e.target.value })}
                      placeholder="Who stole your heart?"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                  </label>
                  <label className="block rounded-md border-2 border-pixel-border bg-background/60 p-4 shadow-[inset_0_2px_8px_-4px_hsl(var(--background))] focus-within:border-secondary/40 focus-within:shadow-[inset_0_2px_8px_-4px_hsl(var(--background)),0_0_18px_-6px_hsl(var(--secondary)/0.55)] transition-all">
                    <span className="block text-[10px] font-pixel uppercase tracking-widest text-muted-foreground mb-2">
                      ⭐ Favorite {unitLabels.unit === "Page" ? "Chapter" : unitLabels.unit === "Unit" ? "Moment" : unitLabels.unit}
                    </span>
                    <input
                      value={draft.favoriteEpisode ?? ""}
                      onChange={(e) => setDraft({ ...draft, favoriteEpisode: e.target.value })}
                      placeholder="The one you'll never forget…"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block rounded-md border-2 border-pixel-border bg-background/60 p-4 shadow-[inset_0_2px_8px_-4px_hsl(var(--background))] focus-within:border-secondary/40 focus-within:shadow-[inset_0_2px_8px_-4px_hsl(var(--background)),0_0_22px_-6px_hsl(var(--secondary)/0.55)] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-[10px] font-pixel uppercase tracking-widest text-muted-foreground">
                      Notes &amp; Reflections
                    </span>
                    <span className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground/70">
                      Last updated · {updatedLabel}
                    </span>
                  </div>
                  <textarea
                    rows={9}
                    value={draft.notes ?? ""}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    placeholder="What did this story leave with you?"
                    className="w-full min-h-[180px] bg-transparent text-sm text-foreground/90 placeholder:text-muted-foreground/60 focus:outline-none resize-none leading-relaxed"
                  />
                </label>
              </div>

              {/* Tags — quiet chips */}
              <div className="space-y-2 animate-fade-in">
                <p className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground/80">
                  Themes you felt
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.ui.tags.map((t) => {
                    const active = draft.tags.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={cn(
                          "px-2.5 h-7 inline-flex items-center rounded-sm border text-xs transition-all",
                          active
                            ? "border-primary/40 bg-primary/10 text-primary/90"
                            : "border-pixel-border/50 bg-card/30 text-muted-foreground/70 hover:text-foreground/80 hover:border-pixel-border"
                        )}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer — quiet remove */}
              <div className="pt-4 border-t-2 border-pixel-border/60 flex items-center justify-between">
                <p className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground">
                  Changes saved automatically
                </p>
                <button
                  onClick={remove}
                  className="h-9 px-3 rounded-sm border-2 border-pixel-border text-muted-foreground hover:text-destructive hover:border-destructive/40 text-xs font-pixel tracking-wide press-down inline-flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove from shelf
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmRemove}
        title={`Remove "${item.title}"?`}
        description="This will move it to Trash. You can restore it later."
        confirmLabel="Move to Trash"
        cancelLabel="Cancel"
        tone="danger"
        icon={<Trash2 className="h-5 w-5" />}
        onClose={() => setConfirmRemove(false)}
        onConfirm={confirmSoftDelete}
      />
    </div>,
    document.body
  );
}
