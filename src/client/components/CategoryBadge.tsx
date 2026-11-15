import { CATEGORY_LABELS, type Category } from "../../shared/recipe";

const COLORS: Record<Category, string> = {
  beef: "bg-beef-bg text-beef-fg",
  pork: "bg-pork-bg text-pork-fg",
  chicken: "bg-chicken-bg text-chicken-fg",
  fish: "bg-fish-bg text-fish-fg",
  side: "bg-side-bg text-side-fg",
  other: "bg-other-bg text-other-fg",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span class={`shrink-0 rounded-full px-2 py-px text-xs font-medium ${COLORS[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
