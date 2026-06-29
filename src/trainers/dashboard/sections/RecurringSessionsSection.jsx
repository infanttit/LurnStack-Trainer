import { useState } from "react";
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
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { PATHS } from "../../../app/router/paths";
import {
  formatDailyWindow,
  formatPriceInPaise,
  getSessionStatus,
  getStatusClass,
  formatDurationHours,
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

      <div className="mt-6">
        {loadingSessions ? (
          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center">
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#00342b]" />
            <div className="mt-3 text-lg font-extrabold">Loading recurring sessions</div>
            <p className="mt-1 text-sm text-slate-500">Fetching your daily live session setup.</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center">
            <FiCalendar className="mx-auto text-4xl text-slate-300" />
            <div className="mt-3 text-lg font-extrabold">No recurring sessions yet</div>
            <p className="mt-1 text-sm text-slate-500">Create one daily session and reuse it every day.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-extrabold whitespace-nowrap">Course & Session</th>
                  <th className="px-4 py-3 font-extrabold whitespace-nowrap">Schedule</th>
                  <th className="px-4 py-3 font-extrabold whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-extrabold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    trainerActionsLocked={trainerActionsLocked}
                    actionId={actionId}
                    onEditSession={onEditSession}
                    onUpdateSessionAction={onUpdateSessionAction}
                    onOpenSessionDialog={onOpenSessionDialog}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function SessionRow({
  session,
  trainerActionsLocked,
  actionId,
  onEditSession,
  onUpdateSessionAction,
  onOpenSessionDialog,
}) {
  const [expanded, setExpanded] = useState(false);
  const status = getSessionStatus(session);
  const lockedSession = trainerActionsLocked || session.isEnded || session.status === "ended";

  let remainingDaysText = "";
  if (session.recurrenceEndDate) {
    const end = new Date(session.recurrenceEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      remainingDaysText = `${diffDays} days remaining`;
    } else if (diffDays === 0) {
      remainingDaysText = "Ends today";
    } else {
      remainingDaysText = "Ended";
    }
  }

  return (
    <>
      <tr 
        className="hover:bg-slate-50 transition-colors cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 align-top max-w-xs">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#006b58] truncate">
            {session.courseTitle}
          </div>
          <div className="font-extrabold text-slate-950 mt-0.5 line-clamp-2">
            {session.title}
          </div>
        </td>
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-1.5 text-xs font-semibold">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <FiClock className="text-[#006b58]" /> 
              {formatDailyWindow(session)}
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-slate-500">
              <FiCalendar className="text-[#006b58]" /> 
              {session.recurrenceType === "daily" ? "Repeats daily" : session.recurrenceType}
            </span>
            {session.recurrenceEndDate && (
              <span className="flex items-center gap-1.5 whitespace-nowrap text-slate-500">
                <FiCalendar className="text-transparent" />
                Ends {new Date(session.recurrenceEndDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                <span className="text-amber-600 font-bold ml-0.5">({remainingDaysText})</span>
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 align-top">
          <span
            className={[
              "inline-flex shrink-0 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider",
              getStatusClass(status),
            ].join(" ")}
          >
            {status}
          </span>
          {session.deleteRequested && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Delete Requested
            </div>
          )}
        </td>
        <td className="px-4 py-3 align-top text-right">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-[#006b58] transition-colors whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? "Hide Details" : "View Details"}
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="4" className="bg-slate-50/50 p-0 border-t-0">
            <div className="px-4 py-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-5">
                <div className="w-full max-w-[240px]">
                  <div className="aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    {session.thumbnail ? (
                      <img src={session.thumbnail} alt={session.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-600 text-white">
                        <FiImage className="text-2xl opacity-80" />
                        <div className="mt-1 text-[10px] font-extrabold">Daily live session</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {session.subtitle ? (
                    <p className="font-semibold text-slate-700 text-sm mb-1">{session.subtitle}</p>
                  ) : null}
                  <p className="text-sm text-slate-600 leading-relaxed">{session.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-y-4 gap-x-8">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Pricing status</div>
                      {session.priceInPaise === null || session.priceInPaise === undefined ? (
                        <span className="text-xs font-black uppercase text-amber-700 mt-0.5 block">Awaiting Admin Pricing</span>
                      ) : (
                        <div className="text-sm font-extrabold text-slate-950 mt-0.5">{formatPriceInPaise(session.priceInPaise)}</div>
                      )}
                    </div>
                  </div>

                  {(session.totalHours || session.totalDays) ? (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 max-w-xl">
                      <div className="text-xs font-extrabold text-slate-700 mb-2.5 uppercase tracking-wider">Course Duration & Progress</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {session.totalHours ? (
                          <div>
                            <span className="text-xs font-medium text-slate-500 block">Total Duration</span>
                            <span className="text-sm font-extrabold text-slate-900">{formatDurationHours(session.totalHours)}</span>
                            {session.completedHours > 0 ? (
                              <div className="mt-1.5">
                                <div className="flex justify-between text-[10px] font-bold text-[#006b58] mb-1">
                                  <span>{session.completedHours} hrs completed</span>
                                  <span>{Math.round(Math.min(100, (session.completedHours / session.totalHours) * 100))}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#006b58] rounded-full" 
                                    style={{ width: `${Math.min(100, (session.completedHours / session.totalHours) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {session.totalDays ? (
                          <div>
                            <span className="text-xs font-medium text-slate-500 block">Total Days</span>
                            <span className="text-sm font-extrabold text-slate-900">{session.totalDays} days</span>
                            {session.completedDays > 0 ? (
                              <div className="mt-1.5">
                                <div className="flex justify-between text-[10px] font-bold text-[#006b58] mb-1">
                                  <span>{session.completedDays} days completed</span>
                                  <span>{Math.round(Math.min(100, (session.completedDays / session.totalDays) * 100))}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#006b58] rounded-full" 
                                    style={{ width: `${Math.min(100, (session.completedDays / session.totalDays) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {session.isTodayCancelled ? (
                    <div className="mt-4 inline-flex rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      Today's class is cancelled{session.todayCancellationReason ? `: ${session.todayCancellationReason}` : "."}
                    </div>
                  ) : null}
                  
                  {session.todayStatus === "completed_today" ? (
                    <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                      Today's session is completed. This recurring session remains active for tomorrow.
                    </div>
                  ) : null}

                  {session.deleteRejectReason ? (
                    <div className="mt-4 inline-flex rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm">
                      <span className="font-bold mr-1">Deletion Request Rejected:</span> {session.deleteRejectReason}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={lockedSession || actionId === `edit:${session.id}`}
                      onClick={() => onEditSession(session)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                    >
                      <FiEdit3 className="text-sm" />
                      <span>Edit</span>
                    </button>
                    
                    {session.isPaused ? (
                      <button
                        type="button"
                        disabled={lockedSession || actionId === `resume:${session.id}`}
                        onClick={() => onUpdateSessionAction(session.id, "resume")}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiPlayCircle className="text-sm" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={lockedSession || actionId === `pause:${session.id}`}
                        onClick={() => onUpdateSessionAction(session.id, "pause")}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 text-xs font-extrabold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiPauseCircle className="text-sm" />
                        <span>Pause</span>
                      </button>
                    )}
                    
                    {session.isTodayCancelled ? (
                      <button
                        type="button"
                        disabled={lockedSession || actionId === `restoreToday:${session.id}`}
                        onClick={() => onUpdateSessionAction(session.id, "restoreToday")}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiRotateCcw className="text-sm" />
                        <span>Restore Today</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={lockedSession || actionId === `cancelToday:${session.id}`}
                        onClick={() => onOpenSessionDialog(session.id, "cancelToday")}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-extrabold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiXCircle className="text-sm" />
                        <span>Cancel Today</span>
                      </button>
                    )}
                    
                    <a
                      href={session.meetingLink || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
                    >
                      <span>Join Meet</span>
                    </a>
                    
                    <button
                      type="button"
                      disabled={
                        lockedSession ||
                        actionId === `end:${session.id}` ||
                        (!session.totalDays && !session.totalHours) ||
                        (session.totalDays && session.completedDays < session.totalDays) ||
                        (session.totalHours && session.completedHours < session.totalHours)
                      }
                      title={
                        (!session.totalDays && !session.totalHours) ||
                        (session.totalDays && session.completedDays < session.totalDays) ||
                        (session.totalHours && session.completedHours < session.totalHours)
                          ? "You can only end the session after completing the full course duration."
                          : "End permanently"
                      }
                      onClick={() => onOpenSessionDialog(session.id, "end")}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-extrabold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm ml-auto"
                    >
                      <FiStopCircle className="text-sm" />
                      <span>End</span>
                    </button>
                    
                    <button
                      type="button"
                      disabled={trainerActionsLocked || actionId === `requestDelete:${session.id}` || session.deleteRequested || !!session.deleteRejectReason}
                      onClick={() => onOpenSessionDialog(session.id, "requestDelete")}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-extrabold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiTrash2 className="text-sm" />
                      <span>{session.deleteRequested ? "Delete Requested (Pending)" : session.deleteRejectReason ? "Request Rejected" : "Request Delete"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
