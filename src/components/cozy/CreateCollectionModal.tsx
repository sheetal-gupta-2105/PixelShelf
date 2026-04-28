import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Upload, Image as ImageIcon, LayoutGrid, Palette, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCozy } from "@/store/cozyStore";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SUGGESTED_ICONS = ["✦", "⚡", "🦇", "🌿", "📖", "🎮", "🌙", "☕", "🌸", "🔮", "🍃", "🪐"];

export function CreateCollectionModal({ open, onClose }: Props) {
  const { state, addCollection, navigateToCollection } = useCozy();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("✦");
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [coverMode, setCoverMode] = useState<"image" | "collage" | "gradient">("gradient");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setIcon("✦");
      setCoverImage(undefined);
      setCoverMode("gradient");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Not an image", description: "Please choose a PNG, JPG or WEBP." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(String(reader.result));
      setCoverMode("image");
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give your world a name");
      return;
    }
    const exists = state.collections.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError("A world with this name already exists");
      return;
    }
    addCollection(trimmed, {
      description: description.trim() || undefined,
      icon,
      coverImage: coverMode === "image" ? coverImage : undefined,
      coverMode,
    });
    toast({ title: "World created ✦", description: `"${trimmed}" is ready to be shaped.` });
    onClose();
    // small delay so modal close animation finishes before navigation
    setTimeout(() => navigateToCollection(trimmed), 80);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] grid place-items-center p-4 bg-background/80 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl pixel-card p-0 overflow-hidden animate-scale-in glow-primary"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-pixel-border bg-surface">
          <div>
            <p className="text-[10px] font-pixel uppercase tracking-[0.2em] text-secondary">
              ✦ open a portal ✦
            </p>
            <h2 className="font-pixel text-2xl text-foreground mt-0.5">New World</h2>
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
          {/* Icon preview + picker */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 grid place-items-center rounded-sm bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/30 border-2 border-primary/40 glow-primary text-4xl">
              {icon}
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
                Choose an icon
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUGGESTED_ICONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setIcon(g)}
                    className={cn(
                      "h-9 w-9 grid place-items-center rounded-sm border-2 text-lg press-down transition-all",
                      icon === g
                        ? "bg-primary/15 border-primary/60 glow-primary"
                        : "bg-card border-pixel-border hover:border-primary/40"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Cozy Autumn Nights"
              className={cn(
                "mt-2 w-full h-11 px-3 rounded-sm bg-background border-2 text-sm focus:outline-none transition-all",
                error
                  ? "border-destructive focus:border-destructive"
                  : "border-pixel-border focus:border-primary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
              )}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note about what lives in this world…"
              className="mt-2 w-full px-3 py-2 rounded-sm bg-background border-2 border-pixel-border text-sm focus:outline-none focus:border-primary/60 resize-none"
            />
          </div>

          {/* Cover poster */}
          <div>
            <label className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              Cover poster
            </label>

            {/* Live preview */}
            <div className="mt-2 relative h-32 rounded-sm overflow-hidden border-2 border-pixel-border">
              {coverMode === "image" && coverImage ? (
                <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/40" />
              )}
              <div
                className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.18) 2px 3px)",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[9px] font-pixel uppercase tracking-[0.2em] text-secondary">Preview</p>
                  <p className="font-pixel text-sm text-foreground drop-shadow-[0_2px_0_hsl(232_23%_8%)]">
                    {name.trim() || "New World"}
                  </p>
                </div>
                <span className="text-xl">{icon}</span>
              </div>
            </div>

            {/* Mode toggles */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCoverMode("gradient")}
                className={cn(
                  "h-9 rounded-sm border-2 text-[11px] font-pixel press-down inline-flex items-center justify-center gap-1.5 transition-all",
                  coverMode === "gradient"
                    ? "border-primary/60 bg-primary/15 text-primary glow-primary"
                    : "border-pixel-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <Palette className="h-3.5 w-3.5" /> Gradient
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-9 rounded-sm border-2 text-[11px] font-pixel press-down inline-flex items-center justify-center gap-1.5 transition-all",
                  coverMode === "image"
                    ? "border-primary/60 bg-primary/15 text-primary glow-primary"
                    : "border-pixel-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <ImageIcon className="h-3.5 w-3.5" /> Upload
              </button>
              <button
                type="button"
                onClick={() => setCoverMode("collage")}
                className={cn(
                  "h-9 rounded-sm border-2 text-[11px] font-pixel press-down inline-flex items-center justify-center gap-1.5 transition-all",
                  coverMode === "collage"
                    ? "border-primary/60 bg-primary/15 text-primary glow-primary"
                    : "border-pixel-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Collage
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {coverMode === "collage"
                  ? "Auto-collage from items inside this world."
                  : coverMode === "image"
                  ? coverImage ? "Custom poster set." : "Upload an image to set a custom poster."
                  : "Default soft gradient."}
              </span>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(undefined);
                    setCoverMode("gradient");
                  }}
                  className="inline-flex items-center gap-1 text-destructive hover:underline press-down"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-pixel-border bg-surface">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-sm border-2 border-pixel-border bg-card text-sm text-muted-foreground hover:text-foreground press-down font-pixel tracking-wide"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="h-10 px-6 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 font-pixel tracking-wide text-sm press-down hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)] transition-shadow inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Create World
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
