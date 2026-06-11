import {
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiEdit3,
  FiImage,
  FiPauseCircle,
  FiPlayCircle,
  FiPlusCircle,
  FiRefreshCw,
  FiRotateCcw,
  FiStopCircle,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { PATHS } from "../../../app/router/paths";
import {
  formatDailyWindow,
  formatPriceInPaise,
  getSessionStatus,
  getStatusClass,
} from "../sessionDisplayUtils";

export default function RecurringSessionsSection({
  sessions,
  message,
  error,
  loadingSessions,
  trainerActionsLocked,
  actionId,
  onNavigate,
  onRefresh,
  onEditSession,
  onUpdateSessionAction,
  onOpenSessionDialog,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-extrabold">Recurring live sessions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage daily sessions without creating a new class every day.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onNavigate(PATHS.TRAINER_CREATE_SESSION)}
            disabled={trainerActionsLocked}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00342b] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlusCircle />
            New daily session
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 transition-colors hover:border-[#006b58]"
          >
            <FiRefreshCw className={loadingSessions ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <FiAlertCircle className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {loadingSessions ? (
          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center md:col-span-2 xl:col-span-3 2xl:col-span-4">
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#00342b]" />
            <div className="mt-3 text-lg font-extrabold">Loading recurring sessions</div>
            <p className="mt-1 text-sm text-slate-500">Fetching your daily live session setup.</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center md:col-span-2 xl:col-span-3 2xl:col-span-4">
            <FiCalendar className="mx-auto text-4xl text-slate-300" />
            <div className="mt-3 text-lg font-extrabold">No recurring sessions yet</div>
            <p className="mt-1 text-sm text-slate-500">Create one daily session and reuse it every day.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              trainerActionsLocked={trainerActionsLocked}
              actionId={actionId}
              onEditSession={onEditSession}
              onUpdateSessionAction={onUpdateSessionAction}
              onOpenSessionDialog={onOpenSessionDialog}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SessionCard({
  session,
  trainerActionsLocked,
  actionId,
  onEditSession,
  onUpdateSessionAction,
  onOpenSessionDialog,
}) {
  const status = getSessionStatus(session);
  const lockedSession = trainerActionsLocked || session.isEnded || session.status === "ended";

  return (
    <article className="w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="h-20 bg-slate-100">
        {session.thumbnail ? (
          <img src={session.thumbnail} alt={session.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-600 text-white">
            <FiImage className="text-2xl opacity-80" />
            <div className="mt-1 text-[10px] font-extrabold">Daily live session</div>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[9px] font-extrabold uppercase tracking-widest text-[#006b58]">
              {session.courseTitle}
            </div>
            <h3 className="mt-1 line-clamp-1 break-words text-sm font-extrabold leading-tight text-slate-950">
              {session.title}
            </h3>
          </div>
          <span className={[
            "inline-flex shrink-0 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
            getStatusClass(status),
          ].join(" ")}
          >
            {status}
          </span>
        </div>

        {session.subtitle ? (
          <p className="mt-0.5 line-clamp-1 break-words text-[10px] font-semibold leading-relaxed text-slate-500">
            {session.subtitle}
          </p>
        ) : null}
        <p className="mt-1.5 line-clamp-1 break-words text-[10px] leading-relaxed text-slate-500">
          {session.description}
        </p>

        <div className="mt-2.5 grid grid-cols-1 gap-1.5 text-[10px] font-semibold text-slate-600">
          <span className="flex min-h-7 items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1">
            <FiClock className="flex-shrink-0 text-[#006b58]" />
            <span className="min-w-0 line-clamp-1 break-words">{formatDailyWindow(session)}</span>
          </span>
          <span className="flex min-h-7 items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1">
            <FiCalendar className="flex-shrink-0 text-[#006b58]" />
            <span className="min-w-0 break-words">
              {session.recurrenceType === "daily" ? "Repeats daily" : session.recurrenceType}
            </span>
          </span>
        </div>

        <div className="mt-2 leading-none">
          <div className="font-extrabold uppercase text-slate-500" style={{ fontSize: "10px", lineHeight: "12px", letterSpacing: "0" }}>
            Pricing status
          </div>
          {session.priceInPaise === null || session.priceInPaise === undefined ? (
            <span
              title="Students cannot enroll until the Admin approves and sets a price for this session."
              className="inline-flex w-fit font-black uppercase text-amber-700"
              style={{ marginTop: "2px", padding: "0", fontSize: "11px", lineHeight: "13px", letterSpacing: "0" }}
            >
              Awaiting Admin Pricing
            </span>
          ) : (
            <div className="mt-px text-[8px] font-extrabold text-slate-950">
              {formatPriceInPaise(session.priceInPaise)}
            </div>
          )}
        </div>

        {session.isTodayCancelled ? (
          <div className="mt-2.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold text-red-700">
            Today's class is cancelled{session.todayCancellationReason ? `: ${session.todayCancellationReason}` : "."}
          </div>
        ) : null}
        {session.todayStatus === "completed_today" ? (
          <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700">
            Today's session is completed. This recurring session remains active for tomorrow.
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={lockedSession || actionId === `edit:${session.id}`}
            onClick={() => onEditSession(session)}
            className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-slate-50 px-1.5 text-[10px] font-extrabold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiEdit3 className="flex-shrink-0" />
            <span className="truncate">Edit</span>
          </button>
          {session.isPaused ? (
            <button
              type="button"
              disabled={lockedSession || actionId === `resume:${session.id}`}
              onClick={() => onUpdateSessionAction(session.id, "resume")}
              className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-emerald-50 px-1.5 text-[10px] font-extrabold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiPlayCircle className="flex-shrink-0" />
              <span className="truncate">Resume</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={lockedSession || actionId === `pause:${session.id}`}
              onClick={() => onUpdateSessionAction(session.id, "pause")}
              className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-amber-50 px-1.5 text-[10px] font-extrabold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiPauseCircle className="flex-shrink-0" />
              <span className="truncate">Pause</span>
            </button>
          )}
          {session.isTodayCancelled ? (
            <button
              type="button"
              disabled={lockedSession || actionId === `restoreToday:${session.id}`}
              onClick={() => onUpdateSessionAction(session.id, "restoreToday")}
              className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-emerald-50 px-1.5 text-[10px] font-extrabold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRotateCcw className="flex-shrink-0" />
              <span className="truncate">Restore</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={lockedSession || actionId === `cancelToday:${session.id}`}
              onClick={() => onOpenSessionDialog(session.id, "cancelToday")}
              className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-red-50 px-1.5 text-[10px] font-extrabold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiXCircle className="flex-shrink-0" />
              <span className="truncate">Cancel today</span>
            </button>
          )}
          <a
            href={session.meetingLink || "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 min-w-0 items-center justify-center rounded-lg bg-slate-50 px-1.5 text-[10px] font-extrabold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <span className="truncate">Meet link</span>
          </a>
          <button
            type="button"
            disabled={lockedSession || actionId === `end:${session.id}`}
            onClick={() => onOpenSessionDialog(session.id, "end")}
            className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-red-600 px-1.5 text-[10px] font-extrabold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiStopCircle className="flex-shrink-0" />
            <span className="truncate">End</span>
          </button>
          <button
            type="button"
            disabled={trainerActionsLocked || actionId === `delete:${session.id}`}
            onClick={() => onOpenSessionDialog(session.id, "delete")}
            className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg bg-red-50 px-1.5 text-[10px] font-extrabold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiTrash2 className="flex-shrink-0" />
            <span className="truncate">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
