export function ConfirmDelete({
  action,
  id,
  next,
  label,
  title,
  message,
  confirmLabel,
  cancelLabel,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  next: string;
  label: string;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  className: string;
}) {
  const popoverId = `confirm-delete-${id}`;

  return (
    <>
      <button className={`${className} cursor-pointer`} type="button" popoverTarget={popoverId}>
        {label}
      </button>
      <div
        id={popoverId}
        popover="auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${popoverId}-title`}
        className="m-auto h-fit w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-black/10 bg-white p-5 shadow-2xl backdrop:bg-emerald-950/30"
      >
        <h2 id={`${popoverId}-title`} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-neutral-700">{message}</p>
        <form action={action} className="mt-4 flex justify-end gap-2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="next" value={next} />
          <button
            className="cursor-pointer rounded border px-3 py-1 text-sm"
            type="button"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
          >
            {cancelLabel}
          </button>
          <button className="cursor-pointer rounded bg-red-700 px-3 py-1 text-sm font-semibold text-white" type="submit">
            {confirmLabel}
          </button>
        </form>
      </div>
    </>
  );
}
