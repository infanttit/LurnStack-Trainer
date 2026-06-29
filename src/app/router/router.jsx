import { Navigate, Route, Routes } from "react-router-dom";
import SignupPage from "../../auth/pages/SignupPage";
import LoginPage from "../../auth/pages/LoginPage";
import RequireAuth from "../../auth/components/RequireAuth";
import TrainerAttendancePage from "../../trainers/attendance/pages/TrainerAttendancePage";
import TrainerSessionHistoryPage from "../../trainers/attendance/pages/TrainerSessionHistoryPage";
import TrainerDashboardPage from "../../trainers/pages/TrainerDashboardPage";
import { PATHS } from "./paths";

const trainerDashboardRoutes = [
  PATHS.TRAINER_OVERVIEW,
  PATHS.TRAINER_PROFILE,
  PATHS.TRAINER_CREATE_SESSION,
  PATHS.TRAINER_RECURRING_SESSIONS,
  PATHS.TRAINER_DASHBOARD_ATTENDANCE,
  PATHS.TRAINER_PAYMENTS,
  PATHS.TRAINER_WALLET,
  PATHS.TRAINER_SESSION_EARNINGS,
  PATHS.TRAINER_PAYOUT_REQUEST,
  PATHS.TRAINER_ACCOUNT_DETAILS,
  PATHS.TRAINER_PAYOUT_HISTORY,
];

const trainerDashboardElement = (
  <RequireAuth role="trainer">
    <TrainerDashboardPage />
  </RequireAuth>
);

export default function AppRouter() {
  return (
    <Routes>
      <Route path={PATHS.HOME} element={<Navigate to={PATHS.TRAINER_OVERVIEW} replace />} />
      <Route path={PATHS.TRAINER_DASHBOARD} element={<Navigate to={PATHS.TRAINER_OVERVIEW} replace />} />
      {trainerDashboardRoutes.map((path) => (
        <Route key={path} path={path} element={trainerDashboardElement} />
      ))}
      <Route
        path={PATHS.TRAINER_ATTENDANCE}
        element={(
          <RequireAuth role="trainer">
            <TrainerAttendancePage />
          </RequireAuth>
        )}
      />
      <Route
        path={PATHS.TRAINER_SESSION_HISTORY}
        element={(
          <RequireAuth role="trainer">
            <TrainerSessionHistoryPage />
          </RequireAuth>
        )}
      />
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.SIGNUP} element={<SignupPage />} />
      <Route path="*" element={<Navigate to={PATHS.TRAINER_OVERVIEW} replace />} />
    </Routes>
  );
}

export const AppRoutes = AppRouter;
