import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  icon?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Reusable cozy-pixel confirmation dialog. Portals to body, locks scroll,
 * closes on overlay click + Escape. Use `tone="danger"` for destructive ops.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  icon,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, onConfirm]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] grid place-items-center p-4 bg-background/80 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-md pixel-card p-0 overflow-hidden animate-scale-in",
          tone === "danger"
            ? "shadow-[0_0_44px_-8px_hsl(var(--destructive)/0.45)]"
            : "glow-primary"
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b-2 border-pixel-border bg-surface">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "h-10 w-10 grid place-items-center rounded-sm border-2 shrink-0",
                tone === "danger"
                  ? "bg-destructive/10 border-destructive/40 text-destructive"
                  : "bg-primary/10 border-primary/40 text-primary"
              )}
            >
              {icon ?? <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-pixel uppercase tracking-[0.2em] text-secondary">
                ✦ confirm ✦
              </p>
              <h2 className="font-pixel text-lg text-foreground mt-0.5 leading-snug">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 grid place-items-center rounded-sm border-2 border-pixel-border bg-card text-muted-foreground hover:text-primary hover:border-primary/60 press-down shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {description && (
          <div className="px-5 py-4 text-sm text-muted-foreground leading-relaxed">
            {description}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t-2 border-pixel-border bg-surface">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-sm border-2 border-pixel-border bg-card text-sm text-muted-foreground hover:text-foreground press-down font-pixel tracking-wide"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={cn(
              "h-10 px-5 rounded-sm border-2 font-pixel tracking-wide text-sm press-down transition-shadow inline-flex items-center gap-2",
              tone === "danger"
                ? "bg-destructive text-destructive-foreground border-destructive/60 hover:shadow-[0_0_22px_-4px_hsl(var(--destructive)/0.7)]"
                : "bg-primary text-primary-foreground border-primary/60 hover:shadow-[0_0_22px_-4px_hsl(var(--primary)/0.7)]"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
