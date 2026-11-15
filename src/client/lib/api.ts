import type { Recipe, RecipeInput } from "../../shared/recipe";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    body: string,
  ) {
    super(`API ${status}: ${body}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listRecipes: () => request<Recipe[]>("/recipes"),
  createRecipe: (input: RecipeInput) =>
    request<Recipe>("/recipes", { method: "POST", body: JSON.stringify(input) }),
  updateRecipe: (id: number, input: RecipeInput) =>
    request<Recipe>(`/recipes/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteRecipe: (id: number) => request<void>(`/recipes/${id}`, { method: "DELETE" }),
};
