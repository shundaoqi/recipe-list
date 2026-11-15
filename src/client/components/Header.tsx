import type { ComponentChildren } from "preact";
import { BackIcon } from "./Icons";

type Props = {
  title?: string;
  onBack?: () => void;
  children?: ComponentChildren;
};

export function Header({ title, onBack, children }: Props) {
  return (
    <header class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-1 border-b border-line bg-white px-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="戻る"
          class="flex size-11 items-center justify-center rounded-full hover:bg-line-soft"
        >
          <BackIcon />
        </button>
      )}
      <h1 class={`flex-1 truncate font-bold ${onBack ? "text-lg" : "pl-3 text-xl"}`}>{title}</h1>
      {children}
    </header>
  );
}
