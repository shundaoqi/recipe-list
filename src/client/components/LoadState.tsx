import { useRecipes } from "../lib/recipes";

/** 読み込み中・読み込み失敗の表示。準備ができていれば null */
export function LoadState() {
  const { status, reload } = useRecipes();
  if (status === "ready") return null;
  if (status === "loading") {
    return <p class="mt-12 text-center text-sm text-muted">読み込み中…</p>;
  }
  return (
    <div class="mt-12 flex flex-col items-center gap-3 text-sm text-muted">
      <p>レシピを読み込めませんでした</p>
      <button
        type="button"
        onClick={reload}
        class="min-h-11 rounded-[10px] border border-outline bg-white px-4 font-bold text-primary"
      >
        再読み込み
      </button>
    </div>
  );
}
