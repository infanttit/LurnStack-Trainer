import {
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiSend,
  FiUser,
} from "react-icons/fi";

export const USE_MOCK_TRAINER_PAYMENTS = true;

export const paymentViews = [
  { id: "wallet", label: "Wallet overview", icon: FiDollarSign },
  { id: "sessions", label: "Session earnings", icon: FiCreditCard },
  { id: "request", label: "Payout request", icon: FiSend },
  { id: "account", label: "Account details", icon: FiUser },
  { id: "payouts", label: "Payout history", icon: FiClock },
];
