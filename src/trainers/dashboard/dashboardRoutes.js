import {
  FiBookOpen,
  FiCalendar,
  FiCreditCard,
  FiDollarSign,
  FiSend,
  FiUser,
  FiUserCheck,
} from "react-icons/fi";
import { PATHS } from "../../app/router/paths";

export const trainerDashboardTabs = [
  { id: "overview", label: "Overview", icon: FiBookOpen, path: PATHS.TRAINER_OVERVIEW },
  { id: "create", label: "Create daily session", icon: FiCalendar, path: PATHS.TRAINER_CREATE_SESSION },
  { id: "sessions", label: "Recurring sessions", icon: FiCalendar, path: PATHS.TRAINER_RECURRING_SESSIONS },
  { id: "attendance", label: "Attendance", icon: FiUserCheck, path: PATHS.TRAINER_DASHBOARD_ATTENDANCE },
  { id: "earnings", label: "Payments", icon: FiCreditCard, path: PATHS.TRAINER_WALLET },
];

export const paymentRouteItems = [
  { id: "wallet", label: "Wallet overview", icon: FiDollarSign, path: PATHS.TRAINER_WALLET },
  { id: "sessions", label: "Session earnings", icon: FiCreditCard, path: PATHS.TRAINER_SESSION_EARNINGS },
  { id: "request", label: "Payout request", icon: FiSend, path: PATHS.TRAINER_PAYOUT_REQUEST },
  { id: "account", label: "Account details", icon: FiUser, path: PATHS.TRAINER_ACCOUNT_DETAILS },
  { id: "payouts", label: "Payout history", icon: FiCalendar, path: PATHS.TRAINER_PAYOUT_HISTORY },
];

export function getDashboardRouteState(pathname) {
  const path = String(pathname || "");
  const paymentItem = paymentRouteItems.find((item) => item.path === path);
  if (paymentItem) return { activeTab: "earnings", activePaymentView: paymentItem.id };
  if (path === PATHS.TRAINER_CREATE_SESSION) return { activeTab: "create", activePaymentView: "wallet" };
  if (path === PATHS.TRAINER_RECURRING_SESSIONS) return { activeTab: "sessions", activePaymentView: "wallet" };
  if (path === PATHS.TRAINER_DASHBOARD_ATTENDANCE || path === PATHS.TRAINER_ATTENDANCE) {
    return { activeTab: "attendance", activePaymentView: "wallet" };
  }
  if (path === PATHS.TRAINER_PROFILE) return { activeTab: "profile", activePaymentView: "wallet" };
  return { activeTab: "overview", activePaymentView: "wallet" };
}
