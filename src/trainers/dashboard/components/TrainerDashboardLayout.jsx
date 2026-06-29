import {
  FiAlertCircle,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiSidebar,
  FiX,
} from "react-icons/fi";
import { PATHS } from "../../../app/router/paths";
import { useAuth } from "../../../auth";
import { paymentRouteItems, trainerDashboardTabs } from "../dashboardRoutes";
import TrainerProfileMenu from "./TrainerProfileMenu";

export default function TrainerDashboardLayout({
  activeTab,
  activePaymentView,
  children,
  isTrainerActive,
  mobileSidebarOpen,
  onLogout,
  onNavigate,
  onOpenSidebar,
  onSetMobileSidebarOpen,
  onSetPaymentMenuOpen,
  onToggleSidebarCollapsed,
  paymentMenuOpen,
  sidebarCollapsed,
  statusError,
  statusLoading,
  trainerActionsLocked,
  user,
  inactiveMessage,
}) {
  const { updateUserProfile } = useAuth();
  return (
    <div className={[
      "grid h-full min-h-0 grid-cols-1 transition-[grid-template-columns] duration-300",
      sidebarCollapsed ? "lg:grid-cols-[92px_1fr]" : "lg:grid-cols-[280px_1fr]",
    ].join(" ")}
    >
      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close trainer sidebar"
          onClick={() => onSetMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      <aside className={[
        "fixed inset-y-0 left-0 z-50 flex h-dvh min-h-0 w-[280px] flex-col overflow-hidden bg-[#00342b] p-5 text-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "lg:w-[92px]" : "lg:w-auto",
      ].join(" ")}
      >
        <SidebarHeader
          collapsed={sidebarCollapsed}
          onClose={() => onSetMobileSidebarOpen(false)}
          onToggleCollapse={onToggleSidebarCollapsed}
        />
        <nav className="mt-10 space-y-2">
          {trainerDashboardTabs.map((tab) => (
            <SidebarTab
              key={tab.id}
              tab={tab}
              collapsed={sidebarCollapsed}
              activeTab={activeTab}
              paymentMenuOpen={paymentMenuOpen}
              onTogglePayments={() => {
                onSetPaymentMenuOpen((prev) => !prev);
                onNavigate(PATHS.TRAINER_WALLET);
              }}
              onNavigate={onNavigate}
            />
          ))}
          {paymentMenuOpen ? (
            <div className={["space-y-1", sidebarCollapsed ? "" : "pl-3"].join(" ")}>
              {paymentRouteItems.map((item) => (
                <PaymentRouteButton
                  key={item.id}
                  item={item}
                  collapsed={sidebarCollapsed}
                  active={activeTab === "earnings" && activePaymentView === item.id}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : null}
        </nav>
        <SidebarUser collapsed={sidebarCollapsed} user={user} onLogout={onLogout} />
      </aside>

      <section className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden">
        <DashboardHeader
          statusLoading={statusLoading}
          isTrainerActive={isTrainerActive}
          statusError={statusError}
          onOpenSidebar={onOpenSidebar}
          user={user}
          updateUserProfile={updateUserProfile}
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          {trainerActionsLocked ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" />
              <span>{inactiveMessage}</span>
            </div>
          ) : null}
          {children}
        </div>
      </section>
    </div>
  );
}

function SidebarHeader({ collapsed, onClose, onToggleCollapse }) {
  return (
    <div className={["flex items-center gap-3", collapsed ? "justify-center" : "justify-between"].join(" ")}>
      {collapsed ? (
        <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-black lg:flex">
          LS
        </div>
      ) : (
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-none">LurnStack</div>
          <div className="mt-1 text-xs font-semibold text-white/60">Trainer Portal</div>
        </div>
      )}
      <button type="button" onClick={onClose} className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/15 lg:hidden" title="Close sidebar">
        <FiX />
      </button>
      <button type="button" onClick={onToggleCollapse} className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/15 lg:inline-flex" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <FiSidebar />
      </button>
    </div>
  );
}

function SidebarTab({ tab, collapsed, activeTab, paymentMenuOpen, onTogglePayments, onNavigate }) {
  const isPaymentsTab = tab.id === "earnings";
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={() => (isPaymentsTab ? onTogglePayments() : onNavigate(tab.path))}
      className={[
        "w-full h-11 rounded-xl text-sm font-extrabold inline-flex items-center gap-3 transition-colors",
        activeTab === tab.id ? "bg-white text-[#00342b] shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white",
        collapsed ? "lg:justify-center lg:px-0" : "justify-start px-4",
      ].join(" ")}
      title={tab.label}
    >
      <Icon className="flex-shrink-0" />
      <span className={collapsed ? "hidden" : "inline truncate"}>{tab.label}</span>
      {isPaymentsTab && !collapsed ? (
        <FiChevronDown className={["ml-auto flex-shrink-0 transition-transform", paymentMenuOpen ? "rotate-180" : ""].join(" ")} />
      ) : null}
    </button>
  );
}

function PaymentRouteButton({ item, collapsed, active, onNavigate }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      className={[
        "w-full h-10 rounded-xl text-xs font-extrabold inline-flex items-center gap-3 transition-colors",
        active ? "bg-white text-[#00342b] shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white",
        collapsed ? "lg:justify-center lg:px-0" : "px-4",
      ].join(" ")}
      title={item.label}
    >
      <Icon className="flex-shrink-0" />
      <span className={collapsed ? "hidden" : "inline truncate"}>{item.label}</span>
    </button>
  );
}

function SidebarUser({ collapsed, user, onLogout }) {
  return (
    <div className={["mt-auto pt-5", collapsed ? "lg:px-0" : ""].join(" ")}>
      {collapsed ? (
        <div className="mx-auto flex h-10 w-10 overflow-hidden items-center justify-center rounded-full bg-white/10 text-sm font-extrabold">
          {user?.profilePhotoUrl || user?.profilePicture ? (
            <img src={user?.profilePhotoUrl || user?.profilePicture} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            (user?.fullName || "T").slice(0, 1).toUpperCase()
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 overflow-hidden items-center justify-center rounded-full bg-white/10 text-sm font-extrabold">
            {user?.profilePhotoUrl || user?.profilePicture ? (
              <img src={user?.profilePhotoUrl || user?.profilePicture} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              (user?.fullName || "T").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold">{user?.fullName || "Trainer"}</div>
            <div className="mt-0.5 truncate text-xs text-white/60">{user?.email}</div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onLogout}
        className={[
          "mt-4 inline-flex h-10 w-full items-center gap-2 rounded-xl bg-red-500/15 text-sm font-extrabold text-red-100 transition-colors hover:bg-red-500/25 hover:text-white",
          collapsed ? "justify-center" : "justify-start px-4",
        ].join(" ")}
        title="Log out"
      >
        <FiLogOut />
        <span className={collapsed ? "hidden" : "inline"}>Log out</span>
      </button>
    </div>
  );
}

function DashboardHeader({ statusLoading, isTrainerActive, statusError, onOpenSidebar, user, updateUserProfile }) {
  return (
    <header className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="mt-0.5 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#00342b] text-white lg:hidden"
            aria-label="Open trainer sidebar"
          >
            <FiMenu />
          </button>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b58] lg:hidden">
              Trainer Portal
            </div>
            <h1 className="text-xl font-extrabold leading-tight text-slate-950 sm:text-3xl">
              Daily recurring live sessions
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
              Create one live session once, then run it every day at the selected time.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider",
                statusLoading
                  ? "border-slate-200 bg-slate-50 text-slate-600"
                  : isTrainerActive
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-amber-100 bg-amber-50 text-amber-700",
              ].join(" ")}
              >
                {statusLoading ? "Checking status" : isTrainerActive ? "Active trainer" : "Inactive trainer"}
              </span>
              {statusError ? <span className="text-xs font-semibold text-red-600">{statusError}</span> : null}
            </div>
          </div>
        </div>
        
        <TrainerProfileMenu />
      </div>
    </header>
  );
}
