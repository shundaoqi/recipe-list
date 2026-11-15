import { z } from "zod";
import { hasQuantity, UNITS } from "./units";

export const CATEGORIES = ["meat", "fish", "side"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  meat: "肉系",
  fish: "魚系",
  side: "副菜",
};

export const ingredientInputSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    quantity: z.number().positive().max(100_000).nullable(),
    unit: z.enum(UNITS),
  })
  .refine((i) => (hasQuantity(i.unit) ? i.quantity !== null : i.quantity === null), {
    message: "数量は単位が適量・少々のときだけ空にできます",
    path: ["quantity"],
  });

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1).max(100),
  category: z.enum(CATEGORIES),
  tiktokUrl: z
    .string()
    .trim()
    .max(500)
    .regex(/^https?:\/\/\S+$/)
    .nullable(),
  memo: z.string().trim().max(1000).nullable(),
  ingredients: z.array(ingredientInputSchema).min(1).max(100),
});

export type IngredientInput = z.infer<typeof ingredientInputSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;

export type Recipe = RecipeInput & {
  id: number;
  createdAt: number;
  updatedAt: number;
};
