import { Clock, Trash2 } from "lucide-react";
import { useCozy } from "@/store/cozyStore";

const formatRelativeTime = (timestamp: number) => {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export function ActivityView() {
  const { state, clearActivity } = useCozy();
  const activity = [...state.activity].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-pixel text-3xl text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Latest shelf changes and favorite picks
          </p>
        </div>
        {activity.length > 0 && (
          <button
            onClick={clearActivity}
            className="h-9 px-3 rounded-sm border-2 border-pixel-border bg-card text-xs text-muted-foreground hover:text-destructive hover:border-destructive/50 press-down flex items-center gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Activity
          </button>
        )}
      </div>

      {activity.length === 0 ? (
        <div className="pixel-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pixel-stars opacity-40" />
          <div className="relative">
            <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-pixel text-xl text-foreground">No activity yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Add media, change status, or favorite an item to start the log.
            </p>
          </div>
        </div>
      ) : (
        <div className="pixel-card p-0 overflow-hidden">
          {activity.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-pixel-border/70 px-5 py-4 last:border-b-0 hover:bg-sidebar-accent/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-pixel text-sm text-foreground">{item.message}</p>
                <p className="mt-1 text-xs text-muted-foreground capitalize">{item.type}</p>
              </div>
              <span className="shrink-0 text-[10px] font-pixel text-muted-foreground">
                {formatRelativeTime(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
