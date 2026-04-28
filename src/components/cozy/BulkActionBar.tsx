import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, FolderPlus, FolderMinus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCozy } from "@/store/cozyStore";
import { useSelection } from "@/store/selectionStore";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "@/hooks/use-toast";

export function BulkActionBar() {
  const { state, addMediaToCollection, removeMediaFromCollectionBulk, softDeleteMedia, restoreMedia } = useCozy();
  const { selected, count, clear } = useSelection();
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (count === 0) return null;

  const ids = Array.from(selected);
  const inCollectionView = state.view === "collection-detail" && state.selectedCollection;

  const handleAddToCollection = (collection: string) => {
    addMediaToCollection(collection, ids);
    toast({ title: `Added to ${collection} ✦`, description: `${count} ${count === 1 ? "item" : "items"} joined this world.` });
    setPickerOpen(false);
    clear();
  };

  const handleRemoveFromCollection = () => {
    if (!inCollectionView) return;
    const name = state.selectedCollection!;
    removeMediaFromCollectionBulk(name, ids);
    toast({ title: `Removed from ${name}`, description: `${count} ${count === 1 ? "item" : "items"} left this world.` });
    clear();
  };

  const handleTrash = () => {
    softDeleteMedia(ids);
    const n = count;
    const restoreIds = [...ids];
    toast({
      title: "Moved to Trash",
      description: `${n} ${n === 1 ? "item" : "items"} can be restored from Trash.`,
      action: (
        <button
          onClick={() => {
            restoreMedia(restoreIds);
            toast({ title: "Restored ✦", description: `${n} ${n === 1 ? "item is" : "items are"} back.` });
          }}
          className="h-8 px-3 rounded-sm border-2 border-primary/60 bg-primary/15 text-primary text-xs font-pixel tracking-wide press-down hover:bg-primary/25"
        >
          Undo
        </button>
      ) as any,
    });
    setConfirmTrash(false);
    clear();
  };

  return createPortal(
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] animate-fade-in">
        <div className="pixel-card glow-primary px-4 py-3 flex items-center gap-3 shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.5)]">
          <span className="font-pixel text-xs uppercase tracking-widest text-primary px-2">
            {count} selected
          </span>
          <span className="h-6 w-px bg-pixel-border" />

          <button
            onClick={() => setPickerOpen(true)}
            className="h-9 px-3 rounded-sm border-2 border-pixel-border bg-card text-xs font-pixel tracking-wide text-foreground hover:border-primary/60 hover:text-primary press-down inline-flex items-center gap-1.5"
          >
            <FolderPlus className="h-3.5 w-3.5" /> Add to Collection
          </button>

          {inCollectionView && (
            <button
              onClick={handleRemoveFromCollection}
              className="h-9 px-3 rounded-sm border-2 border-pixel-border bg-card text-xs font-pixel tracking-wide text-foreground hover:border-secondary/60 hover:text-secondary press-down inline-flex items-center gap-1.5"
            >
              <FolderMinus className="h-3.5 w-3.5" /> Remove from {state.selectedCollection}
            </button>
          )}

          <button
            onClick={() => setConfirmTrash(true)}
            className="h-9 px-3 rounded-sm border-2 border-destructive/40 bg-destructive/10 text-destructive text-xs font-pixel tracking-wide hover:border-destructive/70 hover:bg-destructive/20 press-down inline-flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" /> Move to Trash
          </button>

          <span className="h-6 w-px bg-pixel-border" />
          <button
            onClick={clear}
            aria-label="Cancel selection"
            className="h-9 w-9 grid place-items-center rounded-sm border-2 border-pixel-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 press-down"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collection picker */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-[9999] grid place-items-center p-4 bg-background/80 animate-fade-in"
          onClick={() => setPickerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md pixel-card p-0 overflow-hidden animate-scale-in glow-primary"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-pixel-border bg-surface">
              <div>
                <p className="text-[10px] font-pixel uppercase tracking-[0.2em] text-secondary">
                  ✦ choose a world ✦
                </p>
                <h2 className="font-pixel text-lg text-foreground mt-0.5">
                  Add {count} {count === 1 ? "item" : "items"} to…
                </h2>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                aria-label="Close"
                className="h-8 w-8 grid place-items-center rounded-sm border-2 border-pixel-border bg-card text-muted-foreground hover:text-primary hover:border-primary/60 press-down"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1.5">
              {state.collections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No collections yet. Create one from the Collections page.
                </p>
              ) : (
                state.collections.map((c) => {
                  const meta = state.collectionMeta[c];
                  return (
                    <button
                      key={c}
                      onClick={() => handleAddToCollection(c)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-sm border-2 border-pixel-border bg-card text-left press-down hover:border-primary/60 hover:bg-primary/5 transition-all"
                      )}
                    >
                      <div className="h-9 w-9 grid place-items-center rounded-sm bg-primary/10 border-2 border-primary/30 text-lg shrink-0">
                        {meta?.icon ?? "✦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-sm text-foreground truncate">{c}</p>
                        {meta?.description && (
                          <p className="text-[11px] text-muted-foreground truncate">{meta.description}</p>
                        )}
                      </div>
                      <Check className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmTrash}
        title={`Move ${count} ${count === 1 ? "item" : "items"} to Trash?`}
        description="They will move to Trash. You can restore them later."
        confirmLabel="Move to Trash"
        cancelLabel="Cancel"
        tone="danger"
        icon={<Trash2 className="h-5 w-5" />}
        onClose={() => setConfirmTrash(false)}
        onConfirm={handleTrash}
      />
    </>,
    document.body
  );
}
