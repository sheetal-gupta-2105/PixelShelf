import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaItem, useCozy } from "@/store/cozyStore";
import { MediaCard } from "./MediaCard";

interface FavoritesViewProps {
  onView: (m: MediaItem) => void;
}

export function FavoritesView({ onView }: FavoritesViewProps) {
  const { state } = useCozy();
  const favorites = state.media.filter((m) => m.isFavorite && !m.isDeleted);
  const minCardWidth = state.ui.gridSize === "small" ? "150px" : state.ui.gridSize === "large" ? "260px" : "200px";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-pixel text-3xl text-foreground">Favorites</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {favorites.length} saved favorites from your shelf
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="pixel-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pixel-stars opacity-40" />
          <div className="relative">
            <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-pixel text-xl text-foreground">Nothing favorited yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Tap the heart on any media card to keep it close.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn("grid gap-5", state.ui.compactMode && "gap-3")}
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))` }}
        >
          {favorites.map((item) => (
            <MediaCard key={item.id} item={item} size="lg" badge={item.status} onClick={() => onView(item)} />
          ))}
        </div>
      )}
    </div>
  );
}
