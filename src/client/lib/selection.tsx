import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import type { Recipe } from "../../shared/recipe";
import { useRecipes } from "./recipes";

const STORAGE_KEY = "selectedRecipeIds";

function load(): number[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is number => Number.isInteger(v)) : [];
  } catch {
    return [];
  }
}

function save(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 保存できなくても選択はこの画面の間だけ有効にしておく
  }
}

type SelectionContextValue = {
  /** 選択した順のレシピ（削除済みは含まない） */
  selectedRecipes: Recipe[];
  isSelected: (id: number) => boolean;
  toggle: (id: number) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ComponentChildren }) {
  const { recipes, status } = useRecipes();
  const [ids, setIds] = useState<number[]>(load);

  useEffect(() => save(ids), [ids]);

  // 削除済みのレシピが選択に残っていたら外す
  useEffect(() => {
    if (status !== "ready") return;
    const existing = new Set(recipes.map((r) => r.id));
    setIds((prev) =>
      prev.every((id) => existing.has(id)) ? prev : prev.filter((id) => existing.has(id)),
    );
  }, [recipes, status]);

  const value = useMemo<SelectionContextValue>(() => {
    const byId = new Map(recipes.map((r) => [r.id, r]));
    return {
      selectedRecipes: ids.flatMap((id) => byId.get(id) ?? []),
      isSelected: (id) => ids.includes(id),
      toggle: (id) =>
        setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      clear: () => setIds([]),
    };
  }, [ids, recipes]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
