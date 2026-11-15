import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import { useCallback, useContext, useEffect, useMemo, useState } from "preact/hooks";
import type { Recipe, RecipeInput } from "../../shared/recipe";
import { api } from "./api";

type Status = "loading" | "ready" | "error";

type RecipesContextValue = {
  recipes: Recipe[];
  status: Status;
  reload: () => Promise<void>;
  createRecipe: (input: RecipeInput) => Promise<Recipe>;
  updateRecipe: (id: number, input: RecipeInput) => Promise<Recipe>;
  deleteRecipe: (id: number) => Promise<void>;
};

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: ComponentChildren }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const reload = useCallback(async () => {
    try {
      setRecipes(await api.listRecipes());
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus((s) => (s === "ready" ? s : "error"));
    }
  }, []);

  useEffect(() => {
    reload();
    // もう一人が登録した内容を反映するため、アプリに戻ってきたら取り直す
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  const value = useMemo<RecipesContextValue>(
    () => ({
      recipes,
      status,
      reload,
      createRecipe: async (input) => {
        const created = await api.createRecipe(input);
        setRecipes((rs) => [created, ...rs]);
        return created;
      },
      updateRecipe: async (id, input) => {
        const updated = await api.updateRecipe(id, input);
        setRecipes((rs) => rs.map((r) => (r.id === id ? updated : r)));
        return updated;
      },
      deleteRecipe: async (id) => {
        await api.deleteRecipe(id);
        setRecipes((rs) => rs.filter((r) => r.id !== id));
      },
    }),
    [recipes, status, reload],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes(): RecipesContextValue {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error("useRecipes must be used within RecipesProvider");
  return ctx;
}
