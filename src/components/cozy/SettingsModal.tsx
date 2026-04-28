import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Grid3X3, Plus, Trash2, Upload, X } from "lucide-react";
import { useCozy } from "@/store/cozyStore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { state, setPreferences, addTag, deleteTag, exportData, importData } = useCozy();
  const [tagName, setTagName] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const updatePreference = (preference: Parameters<typeof setPreferences>[0], label: string) => {
    setPreferences(preference);
    toast({ title: `${label} updated`, description: "Your shelf changed instantly." });
  };

  const submitTag = () => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    addTag(trimmed);
    setTagName("");
    toast({ title: "Tag added", description: `#${trimmed} is ready to use.` });
  };

  const downloadExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cozytracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export ready", description: "Your shelf was saved as JSON." });
  };

  const handleImport = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      toast(ok ? { title: "Import complete", description: "Your CozyTracker data was restored." } : { title: "Import failed", description: "That file does not look like CozyTracker data." });
    };
    reader.readAsText(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] grid place-items-center p-4 bg-background/80 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg pixel-card p-0 overflow-hidden animate-scale-in glow-primary">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-pixel-border bg-surface">
          <div>
            <p className="text-[10px] font-pixel uppercase tracking-[0.2em] text-secondary">✦ preferences ✦</p>
            <h2 className="font-pixel text-2xl text-foreground mt-0.5">Settings</h2>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-sm border-2 border-pixel-border bg-card text-muted-foreground hover:text-primary hover:border-primary/60 press-down" aria-label="Close settings">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <section className="rounded-sm border-2 border-pixel-border bg-background p-4 space-y-3">
            <p className="font-pixel text-sm text-foreground">Theme Selection</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["cozy", "Cozy Pixel"],
                ["twilight", "Twilight"],
                ["forest", "Forest"],
              ].map(([value, label]) => (
                <button key={value} onClick={() => updatePreference({ theme: value as typeof state.ui.theme }, "Theme")} className={cn("h-10 rounded-sm border-2 bg-card text-xs font-pixel press-down transition-all", state.ui.theme === value ? "border-primary text-primary glow-primary" : "border-pixel-border text-muted-foreground hover:text-foreground")}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-sm border-2 border-pixel-border bg-background p-4 space-y-3">
            <p className="font-pixel text-sm text-foreground flex items-center gap-2"><Grid3X3 className="h-4 w-4 text-primary" /> UI Preferences</p>
            <div className="flex flex-wrap gap-2">
              {["small", "medium", "large"].map((size) => (
                <button key={size} onClick={() => updatePreference({ gridSize: size as typeof state.ui.gridSize }, "Grid size")} className={cn("h-9 px-3 rounded-sm border-2 bg-card text-xs font-pixel capitalize press-down transition-all", state.ui.gridSize === size ? "border-primary text-primary glow-primary" : "border-pixel-border text-muted-foreground hover:text-foreground")}>
                  {size}
                </button>
              ))}
              <button onClick={() => updatePreference({ compactMode: !state.ui.compactMode }, "Compact mode")} className={cn("h-9 px-3 rounded-sm border-2 bg-card text-xs font-pixel press-down transition-all", state.ui.compactMode ? "border-secondary text-secondary glow-secondary" : "border-pixel-border text-muted-foreground hover:text-foreground")}>
                Compact {state.ui.compactMode ? "ON" : "OFF"}
              </button>
            </div>
          </section>

          <section className="rounded-sm border-2 border-pixel-border bg-background p-4 space-y-3">
            <p className="font-pixel text-sm text-foreground">Manage Tags</p>
            <div className="flex gap-2">
              <input value={tagName} onChange={(e) => setTagName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitTag()} placeholder="Add a mood tag…" className="h-10 flex-1 rounded-sm border-2 border-pixel-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
              <button onClick={submitTag} className="h-10 px-3 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 font-pixel text-sm press-down inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.ui.tags.map((tag) => (
                <span key={tag} className="inline-flex h-8 items-center gap-2 rounded-sm border-2 border-pixel-border bg-card px-2 text-xs text-foreground">
                  #{tag}
                  <button onClick={() => deleteTag(tag)} className="text-muted-foreground hover:text-destructive press-down" aria-label={`Delete ${tag}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-sm border-2 border-pixel-border bg-background p-4 space-y-3">
            <p className="font-pixel text-sm text-foreground">Data Management</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadExport} className="h-10 px-4 rounded-sm bg-primary text-primary-foreground border-2 border-primary/60 font-pixel text-sm press-down inline-flex items-center gap-2">
                <Download className="h-4 w-4" /> Export JSON
              </button>
              <label className="h-10 px-4 rounded-sm border-2 border-pixel-border bg-card text-foreground font-pixel text-sm press-down inline-flex items-center gap-2 cursor-pointer hover:border-primary/50">
                <Upload className="h-4 w-4" /> Import JSON
                <input type="file" accept="application/json" className="sr-only" onChange={(e) => handleImport(e.target.files?.[0])} />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
