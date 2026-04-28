import { createContext, useContext, useEffect, useReducer, ReactNode, useMemo } from "react";

export type MediaType = "anime" | "manga" | "movie" | "show" | "game" | "book";
export type MediaStatus = "watching" | "reading" | "playing" | "completed" | "planned" | "paused" | "dropped";
export type CozyTheme = "cozy" | "twilight" | "forest";
export type GridSize = "small" | "medium" | "large";

export interface UIState {
  theme: CozyTheme;
  isAmbientOn: boolean;
  gridSize: GridSize;
  compactMode: boolean;
  tags: string[];
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  status: MediaStatus;
  rating: number;
  tags: string[];
  collection: string; // primary collection (kept for backwards compatibility)
  collections?: string[]; // additional collection memberships
  notes?: string;
  progress?: number;
  cover: string; // tailwind gradient class
  poster?: string;
  favoriteEpisode?: string;
  favoriteCharacter?: string;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface CollectionMeta {
  description?: string;
  icon?: string;
  coverImage?: string; // data URL or remote URL for collection cover
  coverMode?: "image" | "collage" | "gradient"; // how to render the background
}

// Helper: does a media item belong to a given collection (primary or additional)?
export function mediaInCollection(m: MediaItem, name: string): boolean {
  if (!name) return false;
  if (m.collection === name) return true;
  return Array.isArray(m.collections) && m.collections.includes(name);
}

// Helper: is this media item active (not in trash)?
export function isActive(m: MediaItem): boolean {
  return !m.isDeleted;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export type ViewKey = "dashboard" | "library" | "collections" | "collection-detail" | "stats" | "trash";

interface State {
  media: MediaItem[];
  collections: string[];
  collectionMeta: Record<string, CollectionMeta>;
  ui: UIState;
  view: ViewKey;
  search: string;
  filters: { type: string; status: string; collection: string; tag: string };
  notifications: NotificationItem[];
  selectedCollection: string | null;
  collectionOrder: Record<string, string[]>; // collectionName -> ordered media ids
}

type Action =
  | { type: "ADD_MEDIA"; payload: MediaItem }
  | { type: "UPDATE_MEDIA"; payload: MediaItem }
  | { type: "DELETE_MEDIA"; payload: string }
  | { type: "SET_VIEW"; payload: ViewKey }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FILTER"; payload: Partial<State["filters"]> }
  | { type: "SET_UI"; payload: Partial<UIState> }
  | { type: "ADD_TAG"; payload: string }
  | { type: "DELETE_TAG"; payload: string }
  | { type: "IMPORT_DATA"; payload: Partial<State> }
  | { type: "MARK_NOTIFICATIONS_READ" }
  | { type: "RESET_DATA" }
  | { type: "OPEN_COLLECTION"; payload: string | null }
  | { type: "REORDER_COLLECTION"; payload: { collection: string; orderedIds: string[] } }
  | { type: "ADD_COLLECTION"; payload: { name: string; meta?: CollectionMeta } }
  | { type: "ADD_MEDIA_TO_COLLECTION"; payload: { collection: string; mediaIds: string[] } }
  | { type: "REMOVE_MEDIA_FROM_COLLECTION"; payload: { collection: string; mediaId: string } }
  | { type: "REMOVE_MEDIA_FROM_COLLECTION_BULK"; payload: { collection: string; mediaIds: string[] } }
  | { type: "SOFT_DELETE_MEDIA"; payload: string[] }
  | { type: "RESTORE_MEDIA"; payload: string[] }
  | { type: "PERMANENT_DELETE_MEDIA"; payload: string[] }
  | { type: "EMPTY_TRASH" }
  | { type: "HYDRATE"; payload: Partial<State> };

const COVERS = [
  "bg-gradient-to-br from-primary/60 via-primary/30 to-secondary/40",
  "bg-gradient-to-br from-secondary/60 via-primary/20 to-primary/50",
  "bg-gradient-to-br from-primary/70 via-secondary/30 to-primary/40",
  "bg-gradient-to-br from-secondary/50 via-secondary/30 to-primary/40",
  "bg-gradient-to-br from-primary/50 via-primary/40 to-secondary/40",
  "bg-gradient-to-br from-secondary/50 to-primary/50",
  "bg-gradient-to-br from-primary/60 to-secondary/30",
  "bg-gradient-to-br from-primary/40 to-secondary/50",
];

export const pickCover = (seed?: string) => {
  if (!seed) return COVERS[Math.floor(Math.random() * COVERS.length)];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
};

const seedMedia = (): MediaItem[] => {
  const now = Date.now();
  const mk = (i: number, m: Partial<MediaItem> & Pick<MediaItem, "title" | "type" | "status">): MediaItem => ({
    id: `seed-${i}`,
    rating: 4,
    tags: [],
    collection: "",
    cover: pickCover(m.title),
    createdAt: now - i * 86400000,
    updatedAt: now - i * 43200000,
    ...m,
  });
  return [
    mk(1, { title: "Stardust Drifters", type: "anime", status: "watching", progress: 64, tags: ["Sci-Fi", "Cozy"], collection: "Anime Universe", rating: 5 }),
    mk(2, { title: "Moonlit Café", type: "manga", status: "reading", progress: 30, tags: ["Slice of Life", "Cozy"], collection: "Cozy Reads", rating: 4 }),
    mk(3, { title: "Echoes of Aether", type: "movie", status: "completed", tags: ["Fantasy"], collection: "", rating: 5 }),
    mk(4, { title: "The Quiet Forest", type: "manga", status: "reading", progress: 40, tags: ["Slice of Life"], collection: "Cozy Reads", rating: 4 }),
    mk(5, { title: "Pixel Wanderer", type: "game", status: "playing", progress: 55, tags: ["Adventure"], collection: "Indie Quests", rating: 5 }),
    mk(6, { title: "Velvet Sky", type: "book", status: "planned", tags: ["Romance"], collection: "Cozy Reads", rating: 0 }),
    mk(7, { title: "Cosmic Ramen", type: "anime", status: "watching", progress: 22, tags: ["Comedy"], collection: "Anime Universe", rating: 4 }),
    mk(8, { title: "Glass Garden", type: "movie", status: "completed", tags: ["Drama"], collection: "Studio Ghibli", rating: 5 }),
    mk(9, { title: "Lantern Hearts", type: "show", status: "watching", progress: 70, tags: ["Mystery"], collection: "", rating: 4 }),
    mk(10, { title: "Cinder & Tide", type: "game", status: "planned", tags: ["Adventure"], collection: "Indie Quests", rating: 0 }),
  ];
};

const initialState: State = {
  media: seedMedia(),
  collections: ["MCU", "DC Multiverse", "Anime Universe", "Studio Ghibli", "Cozy Reads", "Indie Quests"],
  collectionMeta: {
    MCU: { description: "Marvel Cinematic Universe", icon: "⚡" },
    "DC Multiverse": { description: "Heroes of the night", icon: "🦇" },
    "Anime Universe": { description: "Stardust & spirits", icon: "✦" },
    "Studio Ghibli": { description: "Soft, magical worlds", icon: "🌿" },
    "Cozy Reads": { description: "Tea-time companions", icon: "📖" },
    "Indie Quests": { description: "Small games, big hearts", icon: "🎮" },
  },
  ui: {
    theme: "cozy",
    isAmbientOn: false,
    gridSize: "medium",
    compactMode: false,
    tags: ["Cozy", "Sci-Fi", "Slice of Life", "Adventure", "Romance", "Mystery", "Fantasy", "Drama", "Comedy", "Horror"],
  },
  view: "dashboard",
  search: "",
  filters: { type: "All", status: "All", collection: "", tag: "All" },
  notifications: [
    { id: "n1", title: "New episode!", message: "Stardust Drifters EP 13 just aired", time: "2m", read: false },
    { id: "n2", title: "Reminder", message: "You haven't logged anything today ☕", time: "1h", read: false },
    { id: "n3", title: "Streak", message: "12 cozy days in a row — keep going!", time: "5h", read: true },
  ],
  selectedCollection: null,
  collectionOrder: {},
};

function normalizeState(raw: Partial<State> & Record<string, unknown>): State {
  const legacyPreferences = raw.preferences as (Partial<Omit<UIState, "theme">> & { theme?: string }) | undefined;
  const legacyTheme = legacyPreferences?.theme === "cozy-pixel" ? "cozy" : legacyPreferences?.theme;
  return {
    ...initialState,
    ...raw,
    filters: { ...initialState.filters, ...(raw.filters ?? {}) },
    selectedCollection: raw.selectedCollection ?? null,
    collectionOrder: (raw.collectionOrder && typeof raw.collectionOrder === "object") ? raw.collectionOrder as Record<string, string[]> : {},
    collectionMeta: { ...initialState.collectionMeta, ...((raw.collectionMeta as Record<string, CollectionMeta>) ?? {}) },
    ui: {
      ...initialState.ui,
      ...(raw.ui ?? {}),
      ...(legacyPreferences ?? {}),
      theme: ((raw.ui?.theme ?? legacyTheme ?? initialState.ui.theme) as CozyTheme),
      isAmbientOn: Boolean(raw.ui?.isAmbientOn ?? raw.isAmbientOn ?? initialState.ui.isAmbientOn),
      tags: Array.isArray(raw.ui?.tags) ? raw.ui.tags : Array.isArray(raw.tags) ? (raw.tags as string[]) : initialState.ui.tags,
    },
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_MEDIA":
      return { ...state, media: [action.payload, ...state.media] };
    case "UPDATE_MEDIA":
      return { ...state, media: state.media.map((m) => (m.id === action.payload.id ? action.payload : m)) };
    case "DELETE_MEDIA":
      return { ...state, media: state.media.filter((m) => m.id !== action.payload) };
    case "SET_VIEW":
      return { ...state, view: action.payload };
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "SET_FILTER":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "SET_UI":
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case "ADD_TAG": {
      const tag = action.payload.trim();
      if (!tag || state.ui.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return state;
      return { ...state, ui: { ...state.ui, tags: [...state.ui.tags, tag] } };
    }
    case "DELETE_TAG":
      return {
        ...state,
        ui: { ...state.ui, tags: state.ui.tags.filter((t) => t !== action.payload) },
        filters: state.filters.tag === action.payload ? { ...state.filters, tag: "All" } : state.filters,
        media: state.media.map((m) => ({ ...m, tags: m.tags.filter((t) => t !== action.payload) })),
      };
    case "IMPORT_DATA":
      return normalizeState({ ...state, ...action.payload, view: state.view });
    case "MARK_NOTIFICATIONS_READ":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case "RESET_DATA":
      return {
        ...initialState,
        ui: { ...initialState.ui, theme: state.ui.theme, isAmbientOn: state.ui.isAmbientOn },
        view: state.view,
      };
    case "OPEN_COLLECTION":
      return { ...state, selectedCollection: action.payload, view: action.payload ? "collection-detail" : "collections" };
    case "REORDER_COLLECTION":
      return {
        ...state,
        collectionOrder: { ...state.collectionOrder, [action.payload.collection]: action.payload.orderedIds },
      };
    case "ADD_COLLECTION": {
      const name = action.payload.name.trim();
      if (!name) return state;
      const exists = state.collections.some((c) => c.toLowerCase() === name.toLowerCase());
      if (exists) {
        // Just update meta if collection already exists
        return action.payload.meta
          ? { ...state, collectionMeta: { ...state.collectionMeta, [name]: { ...state.collectionMeta[name], ...action.payload.meta } } }
          : state;
      }
      return {
        ...state,
        collections: [...state.collections, name],
        collectionMeta: action.payload.meta
          ? { ...state.collectionMeta, [name]: action.payload.meta }
          : state.collectionMeta,
      };
    }
    case "ADD_MEDIA_TO_COLLECTION": {
      const { collection, mediaIds } = action.payload;
      if (!collection || mediaIds.length === 0) return state;
      const idSet = new Set(mediaIds);
      return {
        ...state,
        media: state.media.map((m) => {
          if (!idSet.has(m.id)) return m;
          // Already in this collection (primary or additional)? skip.
          if (m.collection === collection) return m;
          if (m.collections?.includes(collection)) return m;
          // If no primary collection, set as primary; otherwise add to additional list
          if (!m.collection) {
            return { ...m, collection, updatedAt: Date.now() };
          }
          return {
            ...m,
            collections: [...(m.collections ?? []), collection],
            updatedAt: Date.now(),
          };
        }),
      };
    }
    case "REMOVE_MEDIA_FROM_COLLECTION": {
      const { collection, mediaId } = action.payload;
      return {
        ...state,
        media: state.media.map((m) => {
          if (m.id !== mediaId) return m;
          let next = { ...m, updatedAt: Date.now() };
          if (next.collection === collection) next.collection = "";
          if (next.collections?.includes(collection)) {
            next.collections = next.collections.filter((c) => c !== collection);
          }
          return next;
        }),
        collectionOrder: state.collectionOrder[collection]
          ? { ...state.collectionOrder, [collection]: state.collectionOrder[collection].filter((id) => id !== mediaId) }
          : state.collectionOrder,
      };
    }
    case "REMOVE_MEDIA_FROM_COLLECTION_BULK": {
      const { collection, mediaIds } = action.payload;
      if (!collection || mediaIds.length === 0) return state;
      const idSet = new Set(mediaIds);
      return {
        ...state,
        media: state.media.map((m) => {
          if (!idSet.has(m.id)) return m;
          let next = { ...m, updatedAt: Date.now() };
          if (next.collection === collection) next.collection = "";
          if (next.collections?.includes(collection)) {
            next.collections = next.collections.filter((c) => c !== collection);
          }
          return next;
        }),
        collectionOrder: state.collectionOrder[collection]
          ? {
              ...state.collectionOrder,
              [collection]: state.collectionOrder[collection].filter((id) => !idSet.has(id)),
            }
          : state.collectionOrder,
      };
    }
    case "SOFT_DELETE_MEDIA": {
      const ids = new Set(action.payload);
      if (ids.size === 0) return state;
      const now = Date.now();
      return {
        ...state,
        media: state.media.map((m) =>
          ids.has(m.id) && !m.isDeleted ? { ...m, isDeleted: true, deletedAt: now } : m
        ),
      };
    }
    case "RESTORE_MEDIA": {
      const ids = new Set(action.payload);
      if (ids.size === 0) return state;
      return {
        ...state,
        media: state.media.map((m) =>
          ids.has(m.id) ? { ...m, isDeleted: false, deletedAt: undefined, updatedAt: Date.now() } : m
        ),
      };
    }
    case "PERMANENT_DELETE_MEDIA": {
      const ids = new Set(action.payload);
      if (ids.size === 0) return state;
      // Also strip from collection order maps
      const nextOrder: Record<string, string[]> = {};
      Object.entries(state.collectionOrder).forEach(([k, list]) => {
        nextOrder[k] = list.filter((id) => !ids.has(id));
      });
      return {
        ...state,
        media: state.media.filter((m) => !ids.has(m.id)),
        collectionOrder: nextOrder,
      };
    }
    case "EMPTY_TRASH": {
      const trashedIds = new Set(state.media.filter((m) => m.isDeleted).map((m) => m.id));
      if (trashedIds.size === 0) return state;
      const nextOrder: Record<string, string[]> = {};
      Object.entries(state.collectionOrder).forEach(([k, list]) => {
        nextOrder[k] = list.filter((id) => !trashedIds.has(id));
      });
      return {
        ...state,
        media: state.media.filter((m) => !m.isDeleted),
        collectionOrder: nextOrder,
      };
    }
    case "HYDRATE":
      return normalizeState({ ...state, ...action.payload });
    default:
      return state;
  }
}

interface CozyContextValue {
  state: State;
  addMedia: (m: Omit<MediaItem, "id" | "createdAt" | "updatedAt" | "cover"> & { cover?: string }) => void;
  updateMedia: (m: MediaItem) => void;
  deleteMedia: (id: string) => void;
  setView: (v: ViewKey) => void;
  setSearch: (s: string) => void;
  setFilter: (f: Partial<State["filters"]>) => void;
  setAmbient: (on: boolean) => void;
  setPreferences: (p: Partial<Omit<UIState, "tags" | "isAmbientOn">>) => void;
  setUI: (p: Partial<UIState>) => void;
  addTag: (tag: string) => void;
  deleteTag: (tag: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  markNotificationsRead: () => void;
  resetData: () => void;
  navigateToCollection: (name: string) => void;
  closeCollection: () => void;
  reorderCollection: (collection: string, orderedIds: string[]) => void;
  addCollection: (name: string, meta?: CollectionMeta) => boolean;
  addMediaToCollection: (collection: string, mediaIds: string[]) => void;
  removeMediaFromCollection: (collection: string, mediaId: string) => void;
  removeMediaFromCollectionBulk: (collection: string, mediaIds: string[]) => void;
  softDeleteMedia: (ids: string | string[]) => void;
  restoreMedia: (ids: string | string[]) => void;
  permanentDeleteMedia: (ids: string | string[]) => void;
  emptyTrash: () => void;
}

const CozyContext = createContext<CozyContextValue | null>(null);

const STORAGE_KEY = "cozytracker:v1";

export function CozyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: "HYDRATE", payload: parsed });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist whenever media/collections/ui/notifications change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          media: state.media,
          collections: state.collections,
          collectionMeta: state.collectionMeta,
          notifications: state.notifications,
          ui: state.ui,
          collectionOrder: state.collectionOrder,
        })
      );
    } catch {
      /* ignore */
    }
  }, [state.media, state.collections, state.collectionMeta, state.ui, state.notifications, state.collectionOrder]);

  const value = useMemo<CozyContextValue>(
    () => ({
      state,
      addMedia: (m) =>
        dispatch({
          type: "ADD_MEDIA",
          payload: {
            id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cover: m.cover ?? pickCover(m.title),
            ...m,
          },
        }),
      updateMedia: (m) => dispatch({ type: "UPDATE_MEDIA", payload: { ...m, updatedAt: Date.now() } }),
      deleteMedia: (id) => dispatch({ type: "DELETE_MEDIA", payload: id }),
      setView: (v) => dispatch({ type: "SET_VIEW", payload: v }),
      setSearch: (s) => dispatch({ type: "SET_SEARCH", payload: s }),
      setFilter: (f) => dispatch({ type: "SET_FILTER", payload: f }),
      setAmbient: (on) => dispatch({ type: "SET_UI", payload: { isAmbientOn: on } }),
      setPreferences: (p) => dispatch({ type: "SET_UI", payload: p }),
      setUI: (p) => dispatch({ type: "SET_UI", payload: p }),
      addTag: (tag) => dispatch({ type: "ADD_TAG", payload: tag }),
      deleteTag: (tag) => dispatch({ type: "DELETE_TAG", payload: tag }),
      exportData: () => JSON.stringify({ media: state.media, collections: state.collections, ui: state.ui }, null, 2),
      importData: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (!Array.isArray(parsed.media)) return false;
          dispatch({ type: "IMPORT_DATA", payload: parsed });
          return true;
        } catch {
          return false;
        }
      },
      markNotificationsRead: () => dispatch({ type: "MARK_NOTIFICATIONS_READ" }),
      resetData: () => dispatch({ type: "RESET_DATA" }),
      navigateToCollection: (name) => {
        dispatch({ type: "OPEN_COLLECTION", payload: name });
      },
      closeCollection: () => {
        dispatch({ type: "OPEN_COLLECTION", payload: null });
      },
      reorderCollection: (collection, orderedIds) => {
        dispatch({ type: "REORDER_COLLECTION", payload: { collection, orderedIds } });
      },
      addCollection: (name, meta) => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        const exists = state.collections.some((c) => c.toLowerCase() === trimmed.toLowerCase());
        dispatch({ type: "ADD_COLLECTION", payload: { name: trimmed, meta } });
        return !exists;
      },
      addMediaToCollection: (collection, mediaIds) => {
        dispatch({ type: "ADD_MEDIA_TO_COLLECTION", payload: { collection, mediaIds } });
      },
      removeMediaFromCollection: (collection, mediaId) => {
        dispatch({ type: "REMOVE_MEDIA_FROM_COLLECTION", payload: { collection, mediaId } });
      },
      removeMediaFromCollectionBulk: (collection, mediaIds) => {
        dispatch({ type: "REMOVE_MEDIA_FROM_COLLECTION_BULK", payload: { collection, mediaIds } });
      },
      softDeleteMedia: (ids) => {
        const list = Array.isArray(ids) ? ids : [ids];
        dispatch({ type: "SOFT_DELETE_MEDIA", payload: list });
      },
      restoreMedia: (ids) => {
        const list = Array.isArray(ids) ? ids : [ids];
        dispatch({ type: "RESTORE_MEDIA", payload: list });
      },
      permanentDeleteMedia: (ids) => {
        const list = Array.isArray(ids) ? ids : [ids];
        dispatch({ type: "PERMANENT_DELETE_MEDIA", payload: list });
      },
      emptyTrash: () => {
        dispatch({ type: "EMPTY_TRASH" });
      },
    }),
    [state]
  );

  return <CozyContext.Provider value={value}>{children}</CozyContext.Provider>;
}

export function useCozy() {
  const ctx = useContext(CozyContext);
  if (!ctx) throw new Error("useCozy must be used within CozyProvider");
  return ctx;
}

// Derived helpers
export function useFilteredMedia() {
  const { state } = useCozy();
  return useMemo(() => {
    const q = state.search.trim().toLowerCase();
    return state.media.filter((m) => {
      if (m.isDeleted) return false;
      if (state.filters.type !== "All" && m.type !== state.filters.type.toLowerCase()) return false;
      if (state.filters.status !== "All" && m.status !== state.filters.status.toLowerCase()) return false;
      if (state.filters.collection && !mediaInCollection(m, state.filters.collection)) return false;
      if (state.filters.tag !== "All" && !m.tags.includes(state.filters.tag)) return false;
      if (q && !m.title.toLowerCase().includes(q) && !m.tags.join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [state.media, state.filters, state.search]);
}

// All non-deleted media (used by dashboard, stats, collections, etc.)
export function useActiveMedia() {
  const { state } = useCozy();
  return useMemo(() => state.media.filter(isActive), [state.media]);
}

// All trashed media, sorted by deletedAt (newest first)
export function useTrashMedia() {
  const { state } = useCozy();
  return useMemo(
    () =>
      state.media
        .filter((m) => m.isDeleted)
        .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0)),
    [state.media]
  );
}
