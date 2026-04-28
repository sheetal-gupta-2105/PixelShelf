import { useEffect, useState } from "react";
import { CozySidebar } from "@/components/cozy/CozySidebar";
import { TopBar } from "@/components/cozy/TopBar";
import { DashboardView } from "@/components/cozy/DashboardView";
import { LibraryView } from "@/components/cozy/LibraryView";
import { CollectionsView } from "@/components/cozy/CollectionsView";
import { CollectionDetailView } from "@/components/cozy/CollectionDetailView";
import { StatsView } from "@/components/cozy/SimpleViews";
import { TrashView } from "@/components/cozy/TrashView";
import { AddMediaModal } from "@/components/cozy/AddMediaModal";
import { AddToCollectionModal } from "@/components/cozy/AddToCollectionModal";
import { MediaDetailModal } from "@/components/cozy/MediaDetailModal";
import { SettingsModal } from "@/components/cozy/SettingsModal";
import { BulkActionBar } from "@/components/cozy/BulkActionBar";
import { CozyProvider, useCozy, MediaItem } from "@/store/cozyStore";
import { SelectionProvider, useSelection } from "@/store/selectionStore";
import { cn } from "@/lib/utils";

const ViewSwitcher = ({
  onAdd,
  onAddToCollection,
  onView,
}: {
  onAdd: () => void;
  onAddToCollection: (collection: string) => void;
  onView: (m: MediaItem) => void;
}) => {
  const { state } = useCozy();
  return (
    <main className="flex-1 overflow-y-auto">
      <div key={state.view + (state.selectedCollection ?? "")} className="animate-fade-in">
        {state.view === "dashboard" && <DashboardView onAdd={onAdd} onView={onView} />}
        {state.view === "library" && <LibraryView onView={onView} />}
        {state.view === "collections" && <CollectionsView />}
        {state.view === "collection-detail" && (
          <CollectionDetailView onAddToCollection={onAddToCollection} onView={onView} />
        )}
        {state.view === "stats" && <StatsView />}
        {state.view === "trash" && <TrashView onView={onView} />}
      </div>
    </main>
  );
};

const AppShell = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaultCollection, setAddDefaultCollection] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [detail, setDetail] = useState<MediaItem | null>(null);
  const [chooserCollection, setChooserCollection] = useState<string | null>(null);
  const { state } = useCozy();
  const { clear: clearSelection, count: selectionCount } = useSelection();

  const openAdd = (collection?: string) => {
    setAddDefaultCollection(collection);
    setAddOpen(true);
  };
  const closeAdd = () => {
    setAddOpen(false);
    setAddDefaultCollection(undefined);
  };

  const openChooser = (collection: string) => {
    setChooserCollection(collection);
  };
  const closeChooser = () => setChooserCollection(null);

  useEffect(() => {
    document.documentElement.classList.toggle("cozy-ambient", state.ui.isAmbientOn);
    document.body.classList.toggle("cozy-ambient", state.ui.isAmbientOn);
    return () => document.body.classList.remove("cozy-ambient");
  }, [state.ui.isAmbientOn]);

  useEffect(() => {
    document.documentElement.classList.remove("theme-cozy", "theme-twilight", "theme-forest");
    document.documentElement.classList.add(`theme-${state.ui.theme}`);
    document.body.dataset.cozyTheme = state.ui.theme;
    return () => {
      delete document.body.dataset.cozyTheme;
    };
  }, [state.ui.theme]);

  // Clear selection when navigating between views
  useEffect(() => {
    clearSelection();
  }, [state.view, state.selectedCollection, clearSelection]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (e.key === "Escape") {
        closeAdd();
        setIsSettingsOpen(false);
        setDetail(null);
        setChooserCollection(null);
        if (selectionCount > 0) clearSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectionCount, clearSelection]);

  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-background text-foreground app-shell theme-transition", state.ui.compactMode && "compact-mode")}>
      <CozySidebar onSettings={() => setIsSettingsOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onAdd={() => openAdd()} onProfile={() => setIsSettingsOpen(true)} />
        <ViewSwitcher
          onAdd={() => openAdd()}
          onAddToCollection={(c) => openChooser(c)}
          onView={(m) => setDetail(m)}
        />
      </div>
      <AddMediaModal open={addOpen} onClose={closeAdd} defaultCollection={addDefaultCollection} />
      <AddToCollectionModal
        open={chooserCollection !== null}
        collection={chooserCollection}
        onClose={closeChooser}
        onCreateNew={() => chooserCollection && openAdd(chooserCollection)}
      />
      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <MediaDetailModal item={detail} onClose={() => setDetail(null)} />
      <BulkActionBar />
    </div>
  );
};

const Index = () => (
  <CozyProvider>
    <SelectionProvider>
      <AppShell />
    </SelectionProvider>
  </CozyProvider>
);

export default Index;
