import { Trash2, RotateCcw, Sparkles, Flame } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MediaItem, useCozy, useTrashMedia } from "@/store/cozyStore";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "@/hooks/use-toast";

interface Props {
  onView?: (m: MediaItem) => void;
}

function formatDeletedAt(ts?: number) {
  if (!ts) return "—";
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function TrashView({ onView }: Props) {
  const trashed = useTrashMedia();
  const { restoreMedia, permanentDeleteMedia, emptyTrash } = useCozy();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const target = trashed.find((m) => m.id === confirmId) ?? null;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-pixel uppercase tracking-[0.2em] text-secondary mb-2">
            ✦ recycle bin ✦
          </p>
          <h1 className="font-pixel text-3xl text-foreground">Trash</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {trashed.length === 0
              ? "Empty and quiet — nothing has been removed."
              : `${trashed.length} ${trashed.length === 1 ? "item is" : "items are"} resting here. Restore or release them.`}
          </p>
        </div>
        {trashed.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="h-10 px-4 rounded-sm border-2 border-destructive/40 bg-destructive/10 text-destructive text-sm font-pixel tracking-wide hover:border-destructive/70 hover:bg-destructive/20 press-down inline-flex items-center gap-2 transition-colors"
          >
            <Flame className="h-4 w-4" />
            Empty Trash
          </button>
        )}
      </div>

      {trashed.length === 0 ? (
        <div className="pixel-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pixel-stars opacity-30" />
          <div className="relative">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-pixel text-xl text-foreground">Nothing to recover</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Items you remove from your shelf land here first. You can restore them anytime
              before permanently deleting.
            </p>
          </div>
        </div>
      ) : (
        <div className="pixel-card p-2 sm:p-4 space-y-2">
          {trashed.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-2 sm:p-3 rounded-sm border-2 border-pixel-border bg-card/60 hover:border-pixel-border/80 transition-colors"
            >
              {/* Cover */}
              <button
                onClick={() => onView?.(m)}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-sm overflow-hidden border-2 border-pixel-border shrink-0 relative group press-down"
                aria-label={`View ${m.title}`}
              >
                {m.poster ? (
                  <img src={m.poster} alt="" className="h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className={cn("h-full w-full opacity-70 group-hover:opacity-100 transition-opacity", m.cover)} />
                )}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-sm text-foreground truncate">{m.title}</p>
                <p className="text-[11px] text-muted-foreground capitalize truncate mt-0.5">
                  {m.type} · {m.status}
                  {m.collection && ` · ${m.collection}`}
                </p>
                <p className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground/70 mt-1">
                  Removed {formatDeletedAt(m.deletedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    restoreMedia(m.id);
                    toast({ title: "Restored ✦", description: `${m.title} returned to your shelf.` });
                  }}
                  className="h-9 px-3 rounded-sm border-2 border-pixel-border bg-card text-xs font-pixel tracking-wide text-muted-foreground hover:text-primary hover:border-primary/60 press-down inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Restore</span>
                </button>
                <button
                  onClick={() => setConfirmId(m.id)}
                  className="h-9 px-3 rounded-sm border-2 border-pixel-border bg-card text-xs font-pixel tracking-wide text-muted-foreground hover:text-destructive hover:border-destructive/60 press-down inline-flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permanent delete confirm */}
      <ConfirmDialog
        open={!!target}
        title={target ? `Delete "${target.title}" forever?` : ""}
        description={
          <>
            This permanently removes the entry — its poster, journal, ratings and progress.
            <br />
            <span className="text-destructive">This cannot be undone.</span>
          </>
        }
        confirmLabel="Delete forever"
        cancelLabel="Keep in Trash"
        tone="danger"
        icon={<Trash2 className="h-5 w-5" />}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (!target) return;
          const title = target.title;
          permanentDeleteMedia(target.id);
          setConfirmId(null);
          toast({ title: "Released to the void", description: `${title} is gone for good.` });
        }}
      />

      {/* Empty trash confirm */}
      <ConfirmDialog
        open={confirmEmpty}
        title="Empty the entire Trash?"
        description={
          <>
            This permanently removes all <strong>{trashed.length}</strong>{" "}
            {trashed.length === 1 ? "item" : "items"} resting in Trash.
            <br />
            <span className="text-destructive">This cannot be undone.</span>
          </>
        }
        confirmLabel="Empty Trash"
        cancelLabel="Cancel"
        tone="danger"
        icon={<Flame className="h-5 w-5" />}
        onClose={() => setConfirmEmpty(false)}
        onConfirm={() => {
          const n = trashed.length;
          emptyTrash();
          setConfirmEmpty(false);
          toast({ title: "Trash emptied", description: `${n} ${n === 1 ? "item" : "items"} released forever.` });
        }}
      />
    </div>
  );
}
