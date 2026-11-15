import type { IngredientInput } from "./recipe";
import { formatAmount, hasQuantity, type Unit } from "./units";

export type AggregatedIngredient = {
  name: string;
  /** 例: "550g"、"1個 + 100g"、"少々" */
  amount: string;
};

type Bucket = { unit: Unit; quantity: number };

/**
 * 選択したレシピの材料を、材料名ごと・単位ごとに合算する。
 * 並び順は材料名・単位ともに最初に出てきた順。
 */
export function aggregateIngredients(
  recipes: readonly { ingredients: readonly IngredientInput[] }[],
): AggregatedIngredient[] {
  const byName = new Map<string, Map<Unit, Bucket>>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const name = ingredient.name.trim();
      if (!name) continue;

      let buckets = byName.get(name);
      if (!buckets) {
        buckets = new Map();
        byName.set(name, buckets);
      }
      let bucket = buckets.get(ingredient.unit);
      if (!bucket) {
        bucket = { unit: ingredient.unit, quantity: 0 };
        buckets.set(ingredient.unit, bucket);
      }
      if (hasQuantity(ingredient.unit)) bucket.quantity += ingredient.quantity ?? 0;
    }
  }

  return [...byName].map(([name, buckets]) => ({
    name,
    amount: [...buckets.values()].map((b) => formatAmount(b.quantity, b.unit)).join(" + "),
  }));
}

/** コピー用のテキスト（1 行 1 材料） */
export function toShoppingText(rows: readonly AggregatedIngredient[]): string {
  return rows.map((r) => `${r.name} ${r.amount}`).join("\n");
}
