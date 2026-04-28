import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface SelectionContextValue {
  selected: Set<string>;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clear: () => void;
  count: number;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectMany = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selected,
      isSelected: (id: string) => selected.has(id),
      toggle,
      selectMany,
      clear,
      count: selected.size,
    }),
    [selected, toggle, selectMany, clear]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
