import { useMemo } from "react";
import { useCozy } from "@/store/cozyStore";


export function StatsView() {
  const { state } = useCozy();

  const breakdown = useMemo(() => {
    const types = ["anime", "manga", "movie", "show", "game", "book"] as const;
    const colors = [
      "bg-primary",
      "bg-secondary",
      "bg-primary/70",
      "bg-secondary/70",
      "bg-primary/50",
      "bg-secondary/50",
    ];
    const max = state.media.length || 1;
    return types.map((t, i) => {
      const count = state.media.filter((m) => m.type === t).length;
      return {
        label: t.charAt(0).toUpperCase() + t.slice(1),
        value: count,
        pct: (count / max) * 100,
        color: colors[i],
      };
    });
  }, [state.media]);

  const weekly = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const now = Date.now();
    state.media.forEach((m) => {
      const days = Math.floor((now - m.createdAt) / 86400000);
      if (days < 7) {
        const date = new Date(m.createdAt);
        const idx = (date.getDay() + 6) % 7;
        buckets[idx]++;
      }
    });
    const max = Math.max(...buckets, 1);
    return labels.map((label, i) => ({ label, value: (buckets[i] / max) * 100, raw: buckets[i] }));
  }, [state.media]);

  const totals = {
    total: state.media.length,
    watching: state.media.filter((m) => ["watching", "reading", "playing"].includes(m.status)).length,
    completed: state.media.filter((m) => m.status === "completed").length,
    avg: (() => {
      const rated = state.media.filter((m) => m.rating > 0);
      return rated.length
        ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1)
        : "—";
    })(),
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-pixel text-3xl text-foreground">Stats</h1>
        <p className="text-sm text-muted-foreground mt-1">A cozy look at your shelf.</p>
      </div>

      {/* Quick numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: totals.total },
          { label: "Active", value: totals.watching },
          { label: "Completed", value: totals.completed },
          { label: "Avg Rating", value: totals.avg },
        ].map((s) => (
          <div key={s.label} className="pixel-card p-4">
            <p className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
            <p className="font-pixel text-3xl text-foreground mt-2 leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="pixel-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
                Activity
              </p>
              <h3 className="font-pixel text-xl text-foreground mt-1">Added This Week</h3>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-48">
            {weekly.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary/80 border-2 border-primary/60 rounded-sm shadow-[0_0_12px_-2px_hsl(var(--primary)/0.5)] transition-all"
                  style={{ height: `${Math.max(b.value, 4)}%` }}
                  title={`${b.raw} items`}
                />
                <span className="text-[10px] font-pixel text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pixel-card p-6">
          <p className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
            Breakdown
          </p>
          <h3 className="font-pixel text-xl text-foreground mt-1 mb-4">By Type</h3>
          <div className="space-y-3">
            {breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{b.label}</span>
                  <span className="text-muted-foreground font-pixel">{b.value}</span>
                </div>
                <div className="h-2 rounded-sm bg-muted overflow-hidden border border-pixel-border">
                  <div
                    className={`h-full ${b.color} transition-all`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
