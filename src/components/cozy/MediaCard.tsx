import { Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaItem, useCozy } from "@/store/cozyStore";
import { useSelection } from "@/store/selectionStore";

interface MediaCardProps {
  item: MediaItem;
  size?: "sm" | "md" | "lg";
  badge?: string;
  episode?: string;
  onClick?: () => void;
  /** disable selection checkbox (e.g. in trash view) */
  selectable?: boolean;
}

export function MediaCard({ item, size = "md", badge, episode, onClick, selectable = true }: MediaCardProps) {
  const selection = useSelection();
  const { toggleFavorite } = useCozy();
  const isSelected = selectable && selection.isSelected(item.id);
  const selectionMode = selectable && selection.count > 0;

  const sizes = {
    sm: "w-40",
    md: "w-48",
    lg: "w-full",
  };
  const heights = {
    sm: "h-56",
    md: "h-64",
    lg: "h-72",
  };

  const handleClick = (e: React.MouseEvent) => {
    // In selection mode, clicking the card toggles selection instead of opening detail
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      selection.toggle(item.id);
      return;
    }
    onClick?.();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectable) return;
    selection.toggle(item.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "pixel-card-hover overflow-hidden cursor-pointer group shrink-0 text-left relative transition-all",
        sizes[size],
        isSelected && "ring-2 ring-primary/70 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)] -translate-y-0.5"
      )}
    >
      {/* Selection checkbox — top-left */}
      {selectable && (
        <span
          role="checkbox"
          aria-checked={isSelected}
          tabIndex={0}
          onClick={handleCheckboxClick}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              selection.toggle(item.id);
            }
          }}
          className={cn(
            "absolute top-2 left-2 z-20 h-7 w-7 grid place-items-center rounded-sm border-2 transition-all cursor-pointer",
            isSelected
              ? "bg-primary border-primary text-primary-foreground opacity-100 scale-100"
              : "bg-background/80 border-pixel-border text-transparent backdrop-blur-[1px] opacity-0 group-hover:opacity-100",
            selectionMode && "opacity-100"
          )}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}

      <span
        role="button"
        tabIndex={0}
        aria-label={item.isFavorite ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
        onClick={handleFavoriteClick}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(item.id);
          }
        }}
        className={cn(
          "absolute top-2 right-2 z-20 h-8 w-8 grid place-items-center rounded-sm border-2 bg-background/85 backdrop-blur-[1px] transition-all press-down",
          item.isFavorite
            ? "border-secondary/70 text-secondary opacity-100 shadow-[0_0_18px_-6px_hsl(var(--secondary)/0.9)]"
            : "border-pixel-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-secondary hover:border-secondary/60",
          selectionMode && "opacity-100"
        )}
      >
        <Heart className={cn("h-4 w-4", item.isFavorite && "fill-current")} />
      </span>

      {/* Cover */}
      <div className={cn("relative w-full overflow-hidden border-b-2 border-pixel-border", heights[size])}>
        {item.poster ? (
          <img src={item.poster} alt={`${item.title} poster`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className={cn("absolute inset-0", item.cover)} />
        )}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.15) 2px 3px)",
          }}
        />
        {/* Subtle selected-state veil */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/15 pointer-events-none" />
        )}
        <div className="absolute inset-x-0 bottom-0 p-3 pt-12 bg-gradient-to-t from-background/95 via-background/55 to-transparent">
          <h4 className="font-pixel text-sm text-foreground line-clamp-2 drop-shadow-[0_2px_0_hsl(232_23%_8%)]">{item.title}</h4>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground capitalize">{item.type}</p>
            {(episode || (item.progress !== undefined && item.progress > 0)) && (
              <p className="text-[11px] text-primary font-medium">{episode ?? `${item.progress}%`}</p>
            )}
          </div>
        </div>
        <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-sm bg-foreground/70 animate-twinkle" />
        <div
          className="absolute top-5 right-5 h-1 w-1 rounded-sm bg-foreground/50 animate-twinkle"
          style={{ animationDelay: "0.6s" }}
        />

        {badge && (
          <span className="absolute top-12 right-2 px-2 py-0.5 text-[10px] font-pixel uppercase tracking-wider rounded-sm bg-background/80 border border-primary/50 text-primary">
            {badge}
          </span>
        )}

        {item.progress !== undefined && item.progress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-background/70">
            <div
              className="h-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-200 bg-card/95 border-b-2 border-pixel-border px-3 py-2 pl-12">
          <p className="text-[11px] text-foreground truncate">⭐ {item.favoriteEpisode || "No favorite episode yet"}</p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">🎭 {item.favoriteCharacter || "No favorite character yet"}</p>
        </div>
      </div>
    </button>
  );
}
