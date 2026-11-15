import { useEffect, useRef } from "preact/hooks";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirm-title"
      class="m-auto w-[calc(100%-48px)] max-w-sm rounded-2xl bg-white p-0 text-ink shadow-[0_10px_40px_rgba(58,30,11,0.25)] backdrop:bg-black/50"
    >
      <div class="flex flex-col gap-3 px-5 pt-6 pb-4">
        <h2 id="confirm-title" class="text-lg font-bold">
          {title}
        </h2>
        <p class="text-sm text-muted">{message}</p>
        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            class="min-h-11 rounded-lg px-4 font-bold text-primary hover:bg-line-soft"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            class="min-h-11 rounded-[10px] bg-danger px-[18px] font-bold text-white disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
