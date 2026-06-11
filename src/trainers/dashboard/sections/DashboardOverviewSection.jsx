import { FiBookOpen, FiCalendar, FiClock, FiPlusCircle, FiXCircle } from "react-icons/fi";
import { PATHS } from "../../../app/router/paths";
import { formatTime } from "../sessionDisplayUtils";

export default function DashboardOverviewSection({
  courses,
  sessions,
  loadingCourses,
  loadingSessions,
  todaysCancelledCount,
  nextSession,
  trainerActionsLocked,
  onNavigate,
}) {
  const cards = [
    ["Courses", loadingCourses ? "Syncing" : courses.length, FiBookOpen],
    ["Recurring sessions", loadingSessions ? "Syncing" : sessions.length, FiCalendar],
    ["Cancelled today", todaysCancelledCount, FiXCircle],
    [
      "Next daily class",
      nextSession ? formatTime(nextSession.startTime, nextSession.timezone) : "Not scheduled",
      FiClock,
    ],
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="text-xl text-[#006b58]" />
            <div className="mt-4 text-xl font-extrabold">{value}</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Recurring session flow</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
              Trainers create one session, set the daily start and end time, and reuse the same meeting
              link every day. For exceptions, pause the whole recurring session or cancel only today's class.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(PATHS.TRAINER_CREATE_SESSION)}
            disabled={trainerActionsLocked}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00342b] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlusCircle />
            Create daily session
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          {["Select course", "Set daily time", "Share meeting link", "Manage exceptions"].map((item, index) => (
            <div key={item} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00342b] text-sm font-extrabold text-white">
                {index + 1}
              </div>
              <div className="mt-3 text-sm font-extrabold">{item}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
