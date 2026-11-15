import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { CheckIcon } from "./Icons";

type ToastState = { text: string; ok: boolean };

export function useToast(durationMs = 1800) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback(
    (text: string, ok = true) => {
      clearTimeout(timer.current);
      setToast({ text, ok });
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs],
  );

  return { toast, show };
}

export function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <div
      role="status"
      class="pointer-events-none fixed inset-x-0 bottom-28 z-30 flex justify-center px-4"
    >
      {toast && (
        <div class="flex items-center gap-2 rounded-full bg-ink px-[18px] py-2.5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
          {toast.ok && <CheckIcon size={18} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
