import { useState } from "react";
import {
  LayoutDashboard,
  Library,
  FolderHeart,
  BarChart3,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCozy, ViewKey } from "@/store/cozyStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const items: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "library", label: "Library", icon: Library },
  { key: "collections", label: "Collections", icon: FolderHeart },
  { key: "stats", label: "Stats", icon: BarChart3 },
  { key: "trash", label: "Trash", icon: Trash2 },
];

interface CozySidebarProps {
  onSettings: () => void;
}

export function CozySidebar({ onSettings }: CozySidebarProps) {
  const { state, setView, setFilter, setAmbient } = useCozy();
  const [collapsed, setCollapsed] = useState(false);
  const active = state.view;

  const handleNav = (key: ViewKey) => {
    // Clear collection filter when leaving library via nav
    if (key !== "library") setFilter({ collection: "" });
    setView(key);
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r-2 border-sidebar-border bg-sidebar transition-[width] duration-300 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b-2 border-sidebar-border">
        <div className="relative h-8 w-8 shrink-0 rounded-sm bg-primary/15 border-2 border-primary/40 grid place-items-center glow-primary">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="font-pixel text-lg text-foreground tracking-wide">PixelShelf</span>
            <span className="text-[10px] text-muted-foreground font-pixel">v0.1 · cozy build</span>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label="Toggle sidebar"
        className="absolute -right-3 top-20 z-10 h-6 w-6 grid place-items-center rounded-sm border-2 border-pixel-border bg-card text-muted-foreground hover:text-primary hover:border-primary/60 press-down"
      >
        <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
      </button>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-pixel uppercase tracking-widest text-muted-foreground">
            Navigate
          </p>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const trashCount = item.key === "trash"
            ? state.media.filter((m) => m.isDeleted).length
            : 0;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all press-down relative",
                isActive
                  ? "bg-sidebar-accent text-primary pixel-active-indicator"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.7)]"
                )}
              />
              {!collapsed && (
                <span className={cn("font-medium flex-1 text-left", isActive && "font-pixel tracking-wide")}>
                  {item.label}
                </span>
              )}
              {!collapsed && trashCount > 0 && (
                <span
                  className={cn(
                    "px-1.5 h-5 min-w-[20px] inline-flex items-center justify-center rounded-sm border text-[10px] font-pixel tracking-wide transition-colors",
                    isActive
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-card/60 border-pixel-border text-muted-foreground"
                  )}
                >
                  {trashCount}
                </span>
              )}
              {!collapsed && isActive && trashCount === 0 && (
                <span className="ml-auto h-1.5 w-1.5 rounded-sm bg-primary animate-twinkle" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t-2 border-sidebar-border p-3 space-y-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSettings}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground hover:border-primary/30 press-down transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Settings</span>}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="pixel-tooltip">Settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setAmbient(!state.ui.isAmbientOn)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground press-down transition-all",
                state.ui.isAmbientOn && "text-secondary bg-secondary/10 shadow-[0_0_16px_-8px_hsl(var(--secondary)/0.9)]"
              )}
            >
              {state.ui.isAmbientOn ? (
                <Moon className="h-4 w-4 shrink-0 text-secondary drop-shadow-[0_0_7px_hsl(var(--secondary)/0.75)]" />
              ) : (
                <Sun className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {!collapsed && <span>{state.ui.isAmbientOn ? "Ambient" : "Still"}</span>}
              {!collapsed && (
                <span className="ml-auto text-[10px] font-pixel text-muted-foreground">
                  {state.ui.isAmbientOn ? "ON" : "OFF"}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="pixel-tooltip">Ambient Mode</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
