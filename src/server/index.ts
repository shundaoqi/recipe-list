import { zValidator } from "@hono/zod-validator";
import { asc, desc, eq } from "drizzle-orm";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { type Recipe, type RecipeInput, recipeInputSchema } from "../shared/recipe";
import { ingredients, recipes } from "./db/schema";

type Db = DrizzleD1Database;

const idParam = zValidator("param", z.object({ id: z.coerce.number().int().positive() }));
const recipeBody = zValidator("json", recipeInputSchema);

async function findRecipes(db: Db, id?: number): Promise<Recipe[]> {
  const recipeRows = await db
    .select()
    .from(recipes)
    .where(id === undefined ? undefined : eq(recipes.id, id))
    .orderBy(desc(recipes.createdAt), desc(recipes.id));
  if (recipeRows.length === 0) return [];

  const ingredientRows = await db
    .select()
    .from(ingredients)
    .where(id === undefined ? undefined : eq(ingredients.recipeId, id))
    .orderBy(asc(ingredients.recipeId), asc(ingredients.position));

  const byRecipe = Map.groupBy(ingredientRows, (i) => i.recipeId);
  return recipeRows.map((r) => ({
    ...r,
    ingredients: (byRecipe.get(r.id) ?? []).map(({ name, quantity, unit }) => ({
      name,
      quantity,
      unit,
    })),
  }));
}

function ingredientValues(recipeId: number, input: RecipeInput) {
  return input.ingredients.map((i, position) => ({ recipeId, position, ...i }));
}

const app = new Hono<{ Bindings: Env }>()
  .basePath("/api")
  .get("/recipes", async (c) => {
    return c.json(await findRecipes(drizzle(c.env.DB)));
  })
  .get("/recipes/:id", idParam, async (c) => {
    const [recipe] = await findRecipes(drizzle(c.env.DB), c.req.valid("param").id);
    return recipe ? c.json(recipe) : c.json({ error: "not_found" }, 404);
  })
  .post("/recipes", recipeBody, async (c) => {
    const db = drizzle(c.env.DB);
    const input = c.req.valid("json");
    const now = Date.now();
    const { ingredients: _, ...fields } = input;

    const [created] = await db
      .insert(recipes)
      .values({ ...fields, createdAt: now, updatedAt: now })
      .returning({ id: recipes.id });
    if (!created) throw new Error("failed to insert recipe");

    try {
      await db.insert(ingredients).values(ingredientValues(created.id, input));
    } catch (e) {
      await db.delete(recipes).where(eq(recipes.id, created.id));
      throw e;
    }

    const [recipe] = await findRecipes(db, created.id);
    return c.json(recipe, 201);
  })
  .put("/recipes/:id", idParam, recipeBody, async (c) => {
    const db = drizzle(c.env.DB);
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const { ingredients: _, ...fields } = input;

    const exists = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.id, id));
    if (exists.length === 0) return c.json({ error: "not_found" }, 404);

    // 材料は丸ごと置き換える（batch は 1 トランザクションで実行される）
    await db.batch([
      db
        .update(recipes)
        .set({ ...fields, updatedAt: Date.now() })
        .where(eq(recipes.id, id)),
      db.delete(ingredients).where(eq(ingredients.recipeId, id)),
      db.insert(ingredients).values(ingredientValues(id, input)),
    ]);

    const [recipe] = await findRecipes(db, id);
    return c.json(recipe);
  })
  .delete("/recipes/:id", idParam, async (c) => {
    const db = drizzle(c.env.DB);
    const { id } = c.req.valid("param");

    const [, deleted] = await db.batch([
      db.delete(ingredients).where(eq(ingredients.recipeId, id)),
      db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id }),
    ]);
    if (deleted.length === 0) return c.json({ error: "not_found" }, 404);
    return c.body(null, 204);
  })
  .notFound((c) => c.json({ error: "not_found" }, 404))
  .onError((err, c) => {
    console.error(err);
    return c.json({ error: "internal_error" }, 500);
  });

export default app;
