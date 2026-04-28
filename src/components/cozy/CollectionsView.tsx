import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCozy, mediaInCollection } from "@/store/cozyStore";
import { useMemo, useState } from "react";
import { CreateCollectionModal } from "./CreateCollectionModal";
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
  subtitle: "A new world",
  bg: "bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/40",
  glyph: "✦",
};

export function CollectionsView() {
  const { state, navigateToCollection } = useCozy();
  const [activating, setActivating] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    state.collections.forEach((name) => {
      map[name] = state.media.filter((m) => mediaInCollection(m, name)).length;
    });
    return map;
  }, [state.media, state.collections]);

  const itemsByCollection = useMemo(() => {
    const map: Record<string, typeof state.media> = {};
    state.collections.forEach((name) => {
      map[name] = state.media.filter((m) => mediaInCollection(m, name) && !m.isDeleted);
    });
    return map;
  }, [state.media, state.collections]);

  const handleEnter = (name: string) => {
    setActivating(name);
    setTimeout(() => navigateToCollection(name), 180);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-pixel uppercase tracking-[0.2em] text-secondary mb-2">
            ✦ choose a world ✦
          </p>
          <h1 className="font-pixel text-3xl text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step through a portal — your curated worlds await.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 rounded-sm bg-card border-2 border-pixel-border text-sm font-pixel tracking-wide hover:border-primary/60 hover:text-primary press-down flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          New World
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {state.collections.map((name) => {
          const baseMeta = META[name] ?? FALLBACK;
          const customMeta = state.collectionMeta[name];
          const glyph = customMeta?.icon ?? baseMeta.glyph;
          const subtitle = customMeta?.description ?? baseMeta.subtitle;
          const bg = baseMeta.bg ?? FALLBACK.bg;
          const count = counts[name] ?? 0;
          const isActive = activating === name;
          return (
            <button
              key={name}
              onClick={() => handleEnter(name)}
              className={cn(
                "group relative h-56 rounded-md overflow-hidden pixel-border text-left press-down transition-all hover:-translate-y-1",
                isActive && "scale-[1.02] glow-primary"
              )}
            >
              <CollectionCover
                coverImage={customMeta?.coverImage}
                mode={customMeta?.coverMode}
                gradientClass={bg}
                items={itemsByCollection[name]}
              />
              <div className="absolute inset-0 pixel-stars opacity-60 pointer-events-none" />

              <div className="absolute top-4 right-4 h-12 w-12 grid place-items-center rounded-sm bg-background/70 border-2 border-primary/40 backdrop-blur-[1px] glow-primary">
                <span className="text-2xl">{glyph}</span>
              </div>

              <div className="absolute top-0 left-0 h-2 w-2 bg-primary/70" />
              <div className="absolute top-0 right-0 h-2 w-2 bg-secondary/70" />
              <div className="absolute bottom-0 left-0 h-2 w-2 bg-secondary/70" />
              <div className="absolute bottom-0 right-0 h-2 w-2 bg-primary/70" />

              <div className="absolute bottom-0 inset-x-0 p-5">
                <p className="text-[10px] font-pixel uppercase tracking-[0.2em] text-secondary">
                  Portal · {count} {count === 1 ? "item" : "items"}
                </p>
                <h3 className="font-pixel text-2xl text-foreground mt-1 drop-shadow-[0_2px_0_hsl(232_23%_8%)]">
                  {name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-foreground/80">{subtitle}</p>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-pixel text-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isActive ? "ENTERING…" : "ENTER"} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <CreateCollectionModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
