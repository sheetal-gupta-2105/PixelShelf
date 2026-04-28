import { ChevronDown, Search, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaItem, useCozy, useFilteredMedia } from "@/store/cozyStore";
import { MediaCard } from "./MediaCard";

const TYPE_TABS = ["All", "Anime", "Manga", "Movie", "Show", "Game", "Book"];
const STATUS_OPTIONS = ["All", "Watching", "Reading", "Playing", "Completed", "Planned", "Paused", "Dropped"];

interface Props {
  onView: (m: MediaItem) => void;
}

export function LibraryView({ onView }: Props) {
  const { state, setFilter, setSearch } = useCozy();
  const filtered = useFilteredMedia();
  const { type, status, collection } = state.filters;
  const minCardWidth = state.ui.gridSize === "small" ? "150px" : state.ui.gridSize === "large" ? "260px" : "200px";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-pixel text-3xl text-foreground">Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {state.media.length} items · gently sorted by you
          </p>
        </div>
        {collection && (
          <button
            onClick={() => setFilter({ collection: "" })}
            className="h-9 px-3 rounded-sm border-2 border-secondary/50 bg-secondary/10 text-secondary text-xs font-pixel tracking-wide flex items-center gap-2 press-down hover:bg-secondary/20"
          >
            Portal: {collection}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter({ type: t })}
            className={cn(
              "h-9 px-4 rounded-sm border-2 text-sm font-pixel tracking-wide press-down transition-all",
              type === t
                ? "bg-primary/15 border-primary/60 text-primary glow-primary"
                : "bg-card border-pixel-border text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 pixel-card p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={state.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter within library…"
            className="w-full h-9 pl-9 pr-3 rounded-sm bg-background border-2 border-pixel-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>

        <SelectPill
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => setFilter({ status: v })}
        />
        <SelectPill
          label="Collection"
          value={collection || "All"}
          options={["All", ...state.collections]}
          onChange={(v) => setFilter({ collection: v === "All" ? "" : v })}
        />
        <SelectPill
          label="Tag"
          value={state.filters.tag}
          options={["All", ...state.ui.tags]}
          onChange={(v) => setFilter({ tag: v })}
        />
        {(type !== "All" || status !== "All" || collection || state.search) && (
          <button
            onClick={() => {
              setFilter({ type: "All", status: "All", collection: "", tag: "All" });
              setSearch("");
            }}
            className="h-9 px-3 rounded-sm border-2 border-pixel-border bg-card text-xs text-muted-foreground hover:text-foreground press-down flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="pixel-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pixel-stars opacity-40" />
          <div className="relative">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-pixel text-xl text-foreground">No matches</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Try clearing filters or adding something new to your library.
            </p>
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-5", state.ui.compactMode && "gap-3")} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))` }}>
          {filtered.map((it) => (
            <MediaCard key={it.id} item={it} size="lg" badge={it.status} onClick={() => onView(it)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SelectPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-3 pr-8 rounded-sm border-2 border-pixel-border bg-card text-sm text-foreground hover:border-primary/40 hover:text-primary press-down appearance-none focus:outline-none focus:border-primary/60"
      >
        {options.map((o) => (
          <option key={o} value={o} className="capitalize">
            {label}: {o}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}
