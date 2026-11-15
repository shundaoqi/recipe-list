import { CATEGORY_LABELS, type Category } from "../../shared/recipe";

const COLORS: Record<Category, string> = {
  meat: "bg-meat-bg text-meat-fg",
  fish: "bg-fish-bg text-fish-fg",
  side: "bg-side-bg text-side-fg",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span class={`shrink-0 rounded-full px-2 py-px text-xs font-medium ${COLORS[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
