import { FiX } from "react-icons/fi";

export default function ConfirmSessionDialog({ dialog, onClose, onConfirm, onReasonChange }) {
  if (!dialog.open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">{dialog.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{dialog.message}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100" aria-label="Close dialog">
            <FiX />
          </button>
        </div>
        {dialog.action === "cancelToday" ? (
          <div className="px-5 py-4">
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Cancellation reason
              </span>
              <textarea
                value={dialog.reason}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={3}
                placeholder="Example: Trainer unavailable today."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#006b58] focus:ring-4 focus:ring-emerald-900/5"
              />
            </label>
          </div>
        ) : null}
        <div className="flex flex-col justify-end gap-2 bg-slate-50 px-5 py-4 sm:flex-row">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600">
            Keep session
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "h-10 rounded-xl px-5 text-sm font-extrabold text-white",
              dialog.action === "end" || dialog.action === "delete" || dialog.action === "requestDelete" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700",
            ].join(" ")}
          >
            {dialog.action === "delete" ? "Delete session" : dialog.action === "requestDelete" ? "Send Request" : dialog.action === "end" ? "End permanently" : "Cancel today"}
          </button>
        </div>
      </div>
    </div>
  );
}
