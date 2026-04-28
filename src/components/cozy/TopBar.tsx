import { Search, Plus, Bell, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCozy } from "@/store/cozyStore";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TopBarProps {
  onAdd: () => void;
  onProfile?: () => void;
}

export function TopBar({ onAdd, onProfile }: TopBarProps) {
  const { state, setSearch, setView, markNotificationsRead } = useCozy();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 64, right: 24 });
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = state.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const placePanel = () => {
      const rect = bellRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPosition({ top: rect.bottom + 8, right: Math.max(16, window.innerWidth - rect.right) });
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bellRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsNotificationsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsNotificationsOpen(false);

    placePanel();
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [isNotificationsOpen]);

  const notificationPanel = isNotificationsOpen
    ? createPortal(
        <div
          ref={panelRef}
          style={{ top: panelPosition.top, right: panelPosition.right }}
          className="fixed w-80 max-w-[calc(100vw-2rem)] pixel-card p-0 z-[9999] animate-fade-in glow-primary overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-pixel-border bg-surface">
            <p className="font-pixel text-sm tracking-wide">Notifications</p>
            <button
              onClick={markNotificationsRead}
              className="text-[10px] font-pixel text-primary hover:underline flex items-center gap-1 press-down"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {state.notifications.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">All quiet ✨</p>
            )}
            {state.notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "px-4 py-3 border-b border-pixel-border/60 last:border-b-0 hover:bg-sidebar-accent/40 transition-colors",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-sm bg-primary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-pixel text-sm text-foreground truncate">{n.title}</p>
                      <span className="text-[10px] font-pixel text-muted-foreground shrink-0">{n.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <header className="h-16 border-b-2 border-border bg-surface/60 backdrop-blur-[2px] flex items-center gap-4 px-6 shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id="global-search"
          type="text"
          value={state.search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value && state.view !== "library") setView("library");
          }}
          placeholder="Search your cozy library…"
          className="w-full h-10 pl-10 pr-4 rounded-sm bg-background border-2 border-pixel-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] transition-all"
        />
        <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 text-[10px] font-pixel text-muted-foreground border border-pixel-border rounded-sm">
          ⌘K
        </kbd>
      </div>

      <button
        onClick={onAdd}
        className="h-10 px-4 rounded-sm bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 press-down hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)] transition-shadow border-2 border-primary/60"
      >
        <Plus className="h-4 w-4" />
        <span className="font-pixel tracking-wide">Add Media</span>
      </button>

      {/* Bell + dropdown */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={bellRef}
            onClick={() => setIsNotificationsOpen((o) => !o)}
            className={cn(
              "relative h-10 w-10 grid place-items-center rounded-sm bg-card border-2 border-pixel-border text-muted-foreground hover:text-primary hover:border-primary/40 press-down transition-all",
              isNotificationsOpen && "text-primary border-primary/60 shadow-[0_0_18px_-6px_hsl(var(--primary)/0.8)]"
            )}
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-sm bg-secondary animate-pulse" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="pixel-tooltip">Notifications</TooltipContent>
      </Tooltip>
      {notificationPanel}

      {/* Profile */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onProfile}
            className="flex items-center gap-3 pl-3 border-l-2 border-border press-down rounded-sm hover:text-primary transition-colors group"
            aria-label="Open profile & settings"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-pixel text-foreground leading-none group-hover:text-primary transition-colors">Pixel Wanderer</p>
              <p className="text-[10px] text-muted-foreground mt-1">Lvl 12 · Curator</p>
            </div>
            <div className="h-10 w-10 rounded-sm border-2 border-primary/50 bg-gradient-to-br from-primary/30 to-secondary/30 grid place-items-center glow-primary group-hover:border-primary/80 group-hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.7)] transition-all">
              <span className="font-pixel text-sm text-foreground">PW</span>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent className="pixel-tooltip">Profile & settings</TooltipContent>
      </Tooltip>
    </header>
  );
}
