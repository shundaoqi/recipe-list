import { sql } from "drizzle-orm";
import { check, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CATEGORIES } from "../../shared/recipe";
import { UNITS } from "../../shared/units";

export const recipes = sqliteTable(
  "recipes",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    title: text().notNull(),
    category: text({ enum: CATEGORIES }).notNull(),
    tiktokUrl: text("tiktok_url"),
    memo: text(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    check(
      "recipes_category_check",
      sql`${t.category} in (${sql.raw(CATEGORIES.map((c) => `'${c}'`).join(", "))})`,
    ),
  ],
);

export const ingredients = sqliteTable(
  "ingredients",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    name: text().notNull(),
    quantity: real(),
    unit: text({ enum: UNITS }).notNull(),
  },
  (t) => [index("ingredients_recipe_id_position_idx").on(t.recipeId, t.position)],
);
