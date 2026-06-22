import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiBookOpen, FiArrowRight } from "react-icons/fi";
import { PATHS } from "../../../app/router/paths";
import { getTrainerAttendanceSessions } from "../api/trainerAttendanceApi";

export default function TrainerAttendancePage({ embedded = false }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    getTrainerAttendanceSessions()
      .then((res) => {
        if (!ignore) {
          setSessions(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className={embedded ? "text-slate-950" : "min-h-dvh bg-[#f4f7f6] text-slate-950"}>
      {!embedded && <ToastContainer position="top-right" autoClose={3200} />}
      
      {!embedded ? (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
            <Link
              to={PATHS.TRAINER_DASHBOARD}
              className="text-xs font-extrabold uppercase tracking-widest text-[#006b58]"
            >
              Trainer dashboard
            </Link>
            <div className="mt-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Trainer Attendance
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Select a session below to view daily class attendance and historical data.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className={embedded ? "space-y-5" : "mx-auto max-w-7xl px-4 py-6 sm:px-6"}>
        {loading ? (
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-white border border-slate-200 shadow-sm"></div>
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#006b58]/30"
              >
                <div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-4 group-hover:bg-emerald-100 transition-colors">
                    <FiBookOpen className="text-lg" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 line-clamp-1">{session.title || session.courseTitle}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{session.batch || "Live Class"}</p>
                </div>
                <div className="mt-6">
                  <button 
                    onClick={() => navigate(PATHS.TRAINER_SESSION_HISTORY.replace(":sessionId", session.id))}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-extrabold text-[#006b58] transition-colors group-hover:bg-[#00342b] group-hover:text-white"
                  >
                    View Attendance <FiArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FiBookOpen className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-extrabold text-slate-900">No sessions found</h3>
            <p className="mt-2 text-sm text-slate-500">You don't have any assigned sessions yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
