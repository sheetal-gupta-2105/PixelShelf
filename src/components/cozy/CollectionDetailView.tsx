import { ArrowLeft, Plus, Sparkles, GripVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MediaItem, useCozy, mediaInCollection } from "@/store/cozyStore";
import { MediaCard } from "./MediaCard";
import { CollectionCover } from "./CollectionCover";

const META: Record<string, { subtitle: string; bg: string; glyph: string }> = {
  MCU: {
    subtitle: "Marvel Cinematic Universe",
    bg: "bg-gradient-to-br from-[hsl(0_70%_45%)]/70 via-[hsl(30_80%_50%)]/40 to-[hsl(217_60%_30%)]/60",
    glyph: "⚡",
  },
  "DC Multiverse": {
    subtitle: "Heroes of the night",
    bg: "bg-gradient-to-br from-[hsl(220_70%_30%)]/80 via-[hsl(260_50%_40%)]/50 to-[hsl(280_60%_30%)]/70",
    glyph: "🦇",
  },
  "Anime Universe": {
    subtitle: "Stardust & spirits",
    bg: "bg-gradient-to-br from-[hsl(316_72%_60%)]/70 via-[hsl(217_92%_60%)]/40 to-[hsl(280_60%_40%)]/60",
    glyph: "✦",
  },
  "Studio Ghibli": {
    subtitle: "Soft, magical worlds",
    bg: "bg-gradient-to-br from-[hsl(140_50%_45%)]/60 via-[hsl(50_70%_55%)]/40 to-[hsl(200_60%_50%)]/50",
    glyph: "🌿",
  },
  "Cozy Reads": {
    subtitle: "Tea-time companions",
    bg: "bg-gradient-to-br from-[hsl(30_60%_50%)]/60 via-[hsl(10_50%_45%)]/40 to-[hsl(330_50%_55%)]/50",
    glyph: "📖",
  },
  "Indie Quests": {
    subtitle: "Small games, big hearts",
    bg: "bg-gradient-to-br from-[hsl(180_60%_45%)]/60 via-[hsl(217_70%_50%)]/40 to-[hsl(280_60%_45%)]/50",
    glyph: "🎮",
  },
};

const FALLBACK = {
  subtitle: "A curated world",
  bg: "bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/40",
  glyph: "✦",
};

interface Props {
  onAddToCollection: (collection: string) => void;
  onView: (m: MediaItem) => void;
}

export function CollectionDetailView({ onAddToCollection, onView }: Props) {
  const { state, closeCollection, reorderCollection } = useCozy();
  const name = state.selectedCollection;
  const baseMeta = (name && META[name]) || FALLBACK;
  const customMeta = name ? state.collectionMeta[name] : undefined;
  const glyph = customMeta?.icon ?? baseMeta.glyph;
  const subtitle = customMeta?.description ?? baseMeta.subtitle;
  const bg = baseMeta.bg ?? FALLBACK.bg;

  // Compute ordered media for this collection (using mediaInCollection helper)
  const items = useMemo(() => {
    if (!name) return [];
    const inCollection = state.media.filter((m) => mediaInCollection(m, name));
    const savedOrder = state.collectionOrder[name] || [];
    const byId = new Map(inCollection.map((m) => [m.id, m]));
    const ordered: MediaItem[] = [];
    savedOrder.forEach((id) => {
      const m = byId.get(id);
      if (m) {
        ordered.push(m);
        byId.delete(id);
      }
    });
    // append any not yet in saved order (newly added)
    byId.forEach((m) => ordered.push(m));
    return ordered;
  }, [name, state.media, state.collectionOrder]);

  const minCardWidth =
    state.ui.gridSize === "small" ? "150px" : state.ui.gridSize === "large" ? "260px" : "200px";

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Reset drag state when collection changes
  useEffect(() => {
    setDraggedId(null);
    setOverId(null);
  }, [name]);

  if (!name) return null;

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setOverId(null);
      return;
    }
    const ids = items.map((m) => m.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggedId);
    reorderCollection(name, ids);
    setDraggedId(null);
    setOverId(null);
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={closeCollection}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-sm bg-card border-2 border-pixel-border text-xs font-pixel tracking-wide text-muted-foreground hover:text-primary hover:border-primary/60 press-down"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Collections
      </button>

      {/* Banner */}
      <div className="relative h-56 rounded-md overflow-hidden pixel-border glow-primary">
        <CollectionCover
          coverImage={customMeta?.coverImage}
          mode={customMeta?.coverMode}
          gradientClass={bg}
          items={items}
        />
        <div className="absolute inset-0 pixel-stars opacity-60 pointer-events-none" />

        <div className="absolute top-4 right-4 h-14 w-14 grid place-items-center rounded-sm bg-background/70 border-2 border-primary/40 backdrop-blur-[1px] glow-primary">
          <span className="text-3xl">{glyph}</span>
        </div>

        {/* Pixel corner accents */}
        <div className="absolute top-0 left-0 h-2 w-2 bg-primary/70" />
        <div className="absolute top-0 right-0 h-2 w-2 bg-secondary/70" />
        <div className="absolute bottom-0 left-0 h-2 w-2 bg-secondary/70" />
        <div className="absolute bottom-0 right-0 h-2 w-2 bg-primary/70" />

        <div className="absolute bottom-0 inset-x-0 p-6">
          <p className="text-[10px] font-pixel uppercase tracking-[0.25em] text-secondary">
            Portal · {items.length} {items.length === 1 ? "item" : "items"}
          </p>
          <h1 className="font-pixel text-4xl text-foreground mt-1 drop-shadow-[0_2px_0_hsl(232_23%_8%)]">
            {name}
          </h1>
          <p className="text-sm text-foreground/80 mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs font-pixel uppercase tracking-[0.2em] text-muted-foreground">
          ✦ Drag cards to arrange your world ✦
        </p>
        <button
          onClick={() => onAddToCollection(name)}
          className="h-10 px-4 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 text-sm font-pixel tracking-wide press-down hover:shadow-[0_0_22px_-4px_hsl(var(--primary)/0.7)] inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add to this world
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="pixel-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pixel-stars opacity-40" />
          <div className="relative">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-pixel text-xl text-foreground">This world is quiet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Add your first piece of media to begin shaping it.
            </p>
            <button
              onClick={() => onAddToCollection(name)}
              className="mt-5 h-10 px-5 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 text-sm font-pixel tracking-wide press-down inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add first item
            </button>
          </div>
        </div>
      ) : (
        <div
          className={cn("grid gap-5", state.ui.compactMode && "gap-3")}
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))` }}
        >
          {items.map((it) => {
            const isDragging = draggedId === it.id;
            const isOver = overId === it.id && draggedId && draggedId !== it.id;
            return (
              <div
                key={it.id}
                draggable
                onDragStart={(e) => {
                  setDraggedId(it.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setOverId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overId !== it.id) setOverId(it.id);
                }}
                onDragLeave={() => {
                  if (overId === it.id) setOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(it.id);
                }}
                className={cn(
                  "relative group transition-all duration-200",
                  isDragging && "opacity-40 scale-[0.97]",
                  isOver && "scale-[1.03] ring-2 ring-primary/60 rounded-md glow-primary"
                )}
              >
                {/* Drag handle hint */}
                <div className="absolute top-2 right-2 z-10 h-7 w-7 grid place-items-center rounded-sm bg-background/80 border border-pixel-border opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <MediaCard item={it} size="lg" badge={it.status} onClick={() => onView(it)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
