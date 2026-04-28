import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Library, Plus, Search, Check, ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaInCollection, useCozy } from "@/store/cozyStore";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  collection: string | null;
  onClose: () => void;
  onCreateNew: () => void; // open Add Media modal pre-selected with this collection
}

type Step = "choose" | "from-library";

export function AddToCollectionModal({ open, collection, onClose, onCreateNew }: Props) {
  const { state, addMediaToCollection } = useCozy();
  const [step, setStep] = useState<Step>("choose");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setStep("choose");
      setSearch("");
      setSelected(new Set());
    }
  }, [open, collection]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Items NOT already in this collection
  const availableItems = useMemo(() => {
    if (!collection) return [];
    const q = search.trim().toLowerCase();
    return state.media
      .filter((m) => !mediaInCollection(m, collection))
      .filter((m) => {
        if (!q) return true;
        return (
          m.title.toLowerCase().includes(q) ||
          m.tags.join(" ").toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [state.media, collection, search]);

  if (!open || !collection) return null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAddSelected = () => {
    if (selected.size === 0) return;
    addMediaToCollection(collection, Array.from(selected));
    toast({
      title: `Added to ${collection} ✦`,
      description: `${selected.size} ${selected.size === 1 ? "item" : "items"} joined this world.`,
    });
    onClose();
  };

  const handleNewEntry = () => {
    onClose();
    // delay just enough for this modal to unmount cleanly before opening AddMediaModal
    setTimeout(() => onCreateNew(), 60);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] grid place-items-center p-4 bg-background/80 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full pixel-card p-0 overflow-hidden animate-scale-in glow-primary flex flex-col",
          step === "choose" ? "max-w-lg" : "max-w-2xl max-h-[85vh]"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-pixel-border bg-surface">
          <div className="flex items-center gap-3 min-w-0">
            {step === "from-library" && (
              <button
                onClick={() => setStep("choose")}
                className="h-9 w-9 grid place-items-center rounded-sm border-2 border-pixel-border bg-card text-muted-foreground hover:text-primary hover:border-primary/60 press-down shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-pixel uppercase tracking-[0.2em] text-secondary truncate">
                ✦ {collection} ✦
              </p>
              <h2 className="font-pixel text-2xl text-foreground mt-0.5">
                {step === "choose" ? "Add to this world" : "Add from Library"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-sm border-2 border-pixel-border bg-card text-muted-foreground hover:text-primary hover:border-primary/60 press-down shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "choose" ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChoiceCard
              icon={<Library className="h-7 w-7" />}
              title="Add from Library"
              description="Pick existing entries to bring into this world."
              onClick={() => setStep("from-library")}
              accent="primary"
            />
            <ChoiceCard
              icon={<Plus className="h-7 w-7" />}
              title="Add New Entry"
              description="Create a brand-new entry, pre-tagged for this world."
              onClick={handleNewEntry}
              accent="secondary"
            />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-6 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your library…"
                  className="w-full h-10 pl-9 pr-3 rounded-sm bg-background border-2 border-pixel-border text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 min-h-[200px]">
              {availableItems.length === 0 ? (
                <div className="text-center py-10">
                  <Sparkles className="h-7 w-7 text-primary mx-auto mb-2" />
                  <p className="font-pixel text-sm text-foreground">
                    {state.media.some((m) => mediaInCollection(m, collection))
                      ? "Every entry already lives here"
                      : "Nothing to add yet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try clearing the search or adding a new entry.
                  </p>
                </div>
              ) : (
                availableItems.map((m) => {
                  const isOn = selected.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggle(m.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-sm border-2 text-left press-down transition-all",
                        isOn
                          ? "bg-primary/10 border-primary/60 glow-primary"
                          : "bg-card border-pixel-border hover:border-primary/40"
                      )}
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          "h-6 w-6 grid place-items-center rounded-sm border-2 shrink-0 transition-colors",
                          isOn
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-pixel-border bg-background text-transparent"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      {/* Poster / cover */}
                      <div className="h-12 w-12 rounded-sm overflow-hidden border-2 border-pixel-border shrink-0">
                        {m.poster ? (
                          <img src={m.poster} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={cn("h-full w-full", m.cover)} />
                        )}
                      </div>
                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-sm text-foreground truncate">{m.title}</p>
                        <p className="text-[11px] text-muted-foreground capitalize truncate">
                          {m.type} · {m.status}
                          {m.collection && ` · in ${m.collection}`}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t-2 border-pixel-border bg-surface">
              <p className="text-xs text-muted-foreground font-pixel tracking-wide">
                {selected.size} selected
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="h-10 px-5 rounded-sm border-2 border-pixel-border bg-card text-sm text-muted-foreground hover:text-foreground press-down font-pixel tracking-wide"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelected}
                  disabled={selected.size === 0}
                  className={cn(
                    "h-10 px-6 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 font-pixel tracking-wide text-sm press-down transition-all inline-flex items-center gap-2",
                    selected.size === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)]"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Add {selected.size > 0 ? `(${selected.size})` : ""}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  accent: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative p-5 rounded-sm border-2 bg-card text-left press-down transition-all hover:-translate-y-0.5",
        accent === "primary"
          ? "border-pixel-border hover:border-primary/60 hover:glow-primary"
          : "border-pixel-border hover:border-secondary/60"
      )}
    >
      <div
        className={cn(
          "h-12 w-12 grid place-items-center rounded-sm border-2 mb-3 transition-colors",
          accent === "primary"
            ? "bg-primary/10 border-primary/40 text-primary"
            : "bg-secondary/10 border-secondary/40 text-secondary"
        )}
      >
        {icon}
      </div>
      <h3 className="font-pixel text-base text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
    </button>
  );
}
