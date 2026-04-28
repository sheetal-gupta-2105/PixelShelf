import { Flame, Star, Eye, Heart, Plus, Sparkles } from "lucide-react";
import { MediaCard } from "./MediaCard";
import { StatWidget } from "./StatWidget";
import { MediaItem, useCozy } from "@/store/cozyStore";
import { useMemo } from "react";

interface Props {
  onAdd: () => void;
  onView: (m: MediaItem) => void;
}

export function DashboardView({ onAdd, onView }: Props) {
  const { state } = useCozy();

  const stats = useMemo(() => {
    const watching = state.media.filter((m) =>
      ["watching", "reading", "playing"].includes(m.status)
    );
    const completed = state.media.filter((m) => m.status === "completed");
    const rated = state.media.filter((m) => m.rating > 0);
    const avg = rated.length
      ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1)
      : "—";
    return {
      total: state.media.length,
      watching: watching.length,
      completed: completed.length,
      avg,
    };
  }, [state.media]);

  const continueItems = useMemo(
    () =>
      state.media
        .filter((m) => ["watching", "reading", "playing"].includes(m.status))
        .slice(0, 8),
    [state.media]
  );

  const recentItems = useMemo(
    () => [...state.media].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [state.media]
  );

  if (state.media.length === 0) {
    return (
      <div className="p-8 animate-fade-in">
        <EmptyState onAdd={onAdd} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10">
      {/* Welcome */}
      <section className="pixel-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 pixel-stars opacity-60" />
        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs font-pixel uppercase tracking-[0.2em] text-secondary mb-2">
              ✦ welcome back ✦
            </p>
            <h1 className="font-pixel text-4xl text-foreground">Evening, Wanderer.</h1>
            <p className="text-muted-foreground mt-2 max-w-md text-sm">
              You have <span className="text-primary font-semibold">{stats.watching} stories</span>{" "}
              waiting and a fresh quest in your library. Take a cozy seat. ☕
            </p>
          </div>
          <button
            onClick={onAdd}
            className="h-11 px-5 rounded-sm bg-secondary/15 border-2 border-secondary/40 text-secondary font-pixel tracking-wide flex items-center gap-2 press-down hover:bg-secondary/25 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Quick Log
          </button>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget label="Total Tracked" value={stats.total} hint="across your shelves" icon={Star} tone="primary" />
        <StatWidget label="Currently Active" value={stats.watching} hint="in progress now" icon={Eye} tone="secondary" />
        <StatWidget label="Completed" value={stats.completed} hint="finished journeys" icon={Heart} tone="primary" />
        <StatWidget label="Avg Rating" value={stats.avg} hint="across rated items" icon={Flame} tone="secondary" />
      </section>

      {/* Continue */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-pixel text-2xl text-foreground">Continue Watching</h2>
            <p className="text-xs text-muted-foreground mt-1">Pick up where you wandered off ✨</p>
          </div>
        </div>
        {continueItems.length === 0 ? (
          <div className="pixel-card p-6 text-center text-sm text-muted-foreground">
            Nothing in progress. Start a new adventure!
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
            {continueItems.map((it) => (
              <MediaCard key={it.id} item={it} onClick={() => onView(it)} />
            ))}
          </div>
        )}
      </section>

      {/* Recently added */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-pixel text-2xl text-foreground">Recently Added</h2>
            <p className="text-xs text-muted-foreground mt-1">Fresh additions to your shelf</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recentItems.map((it) => (
            <MediaCard key={it.id} item={it} size="lg" badge="New" onClick={() => onView(it)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="pixel-card p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 pixel-stars opacity-50" />
      <div className="relative">
        <div className="mx-auto h-16 w-16 grid place-items-center rounded-sm bg-primary/15 border-2 border-primary/40 glow-primary mb-5">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-pixel text-3xl text-foreground">Your shelf is quiet</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Start your cozy collection by adding your first piece of media — a film, a book, a game, anything you love.
        </p>
        <button
          onClick={onAdd}
          className="mt-6 h-11 px-6 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 font-pixel tracking-wide text-sm press-down inline-flex items-center gap-2 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)]"
        >
          <Plus className="h-4 w-4" />
          Add your first item
        </button>
      </div>
    </div>
  );
}
