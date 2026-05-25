import { Navigate, Route, Routes } from "react-router-dom";
import SignupPage from "../../auth/pages/SignupPage";
import LoginPage from "../../auth/pages/LoginPage";
import RequireAuth from "../../auth/components/RequireAuth";
import TrainerAttendancePage from "../../trainers/pages/TrainerAttendancePage";
import TrainerDashboardPage from "../../trainers/pages/TrainerDashboardPage";
import { PATHS } from "./paths";

export default function AppRouter() {
  return (
    <Routes>
      <Route path={PATHS.HOME} element={<Navigate to={PATHS.TRAINER_DASHBOARD} replace />} />
      <Route
        path={PATHS.TRAINER_DASHBOARD}
        element={(
          <RequireAuth role="trainer">
            <TrainerDashboardPage />
          </RequireAuth>
        )}
      />
      <Route
        path={PATHS.TRAINER_ATTENDANCE}
        element={(
          <RequireAuth role="trainer">
            <TrainerAttendancePage />
          </RequireAuth>
        )}
      />
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.SIGNUP} element={<SignupPage />} />
      <Route path="*" element={<Navigate to={PATHS.TRAINER_DASHBOARD} replace />} />
    </Routes>
  );
}

export const AppRoutes = AppRouter;
