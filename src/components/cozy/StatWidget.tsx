import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatWidgetProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "secondary";
}

export function StatWidget({ label, value, hint, icon: Icon, tone = "primary" }: StatWidgetProps) {
  return (
    <div className="pixel-card p-4 relative overflow-hidden group hover:border-primary/40 transition-colors">
      {/* corner pixel deco */}
      <div className="absolute -right-6 -top-6 h-20 w-20 opacity-10 pixel-stars" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-pixel uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="font-pixel text-3xl text-foreground mt-2 leading-none">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
        </div>
        <div
          className={cn(
            "h-9 w-9 grid place-items-center rounded-sm border-2",
            tone === "primary"
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-secondary/15 border-secondary/40 text-secondary"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
