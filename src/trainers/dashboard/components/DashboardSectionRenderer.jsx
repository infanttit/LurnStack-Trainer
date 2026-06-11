import TrainerAttendancePage from "../../attendance/pages/TrainerAttendancePage";
import TrainerPaymentsSection from "../../payments/components/TrainerPaymentsSection";
import CreateSessionSection from "../sections/CreateSessionSection";
import DashboardOverviewSection from "../sections/DashboardOverviewSection";
import RecurringSessionsSection from "../sections/RecurringSessionsSection";

export default function DashboardSectionRenderer({ activeTab, activePaymentView, data, handlers }) {
  if (activeTab === "create") {
    return (
      <CreateSessionSection
        form={data.form}
        formErrors={data.formErrors}
        message={data.message}
        error={data.error}
        editingSessionId={data.editingSessionId}
        loadingCourses={data.loadingCourses}
        submitting={data.submitting}
        trainerActionsLocked={data.trainerActionsLocked}
        courseTitleSuggestions={data.courseTitleSuggestions}
        combinedCategorySuggestions={data.combinedCategorySuggestions}
        fieldClass={handlers.fieldClass}
        onSubmit={handlers.handleSubmit}
        onCancelEditing={handlers.cancelEditing}
        onChange={handlers.handleChange}
        onCourseTitleChange={handlers.handleCourseTitleChange}
        onThumbnailChange={handlers.handleThumbnailChange}
      />
    );
  }
  if (activeTab === "sessions") {
    return (
      <RecurringSessionsSection
        sessions={data.sessions}
        message={data.message}
        error={data.error}
        loadingSessions={data.loadingSessions}
        trainerActionsLocked={data.trainerActionsLocked}
        actionId={data.actionId}
        onNavigate={handlers.goTo}
        onRefresh={() => handlers.loadSessions()}
        onEditSession={handlers.startEditingSession}
        onUpdateSessionAction={handlers.updateSessionAction}
        onOpenSessionDialog={handlers.openSessionDialog}
      />
    );
  }
  if (activeTab === "attendance") {
    return (
      <section>
        <TrainerAttendancePage embedded />
      </section>
    );
  }
  if (activeTab === "earnings") {
    return <TrainerPaymentsSection activeView={activePaymentView} isTrainerActive={data.isTrainerActive} />;
  }
  return (
    <DashboardOverviewSection
      courses={data.courses}
      sessions={data.sessions}
      loadingCourses={data.loadingCourses}
      loadingSessions={data.loadingSessions}
      todaysCancelledCount={data.todaysCancelledCount}
      nextSession={data.nextSession}
      trainerActionsLocked={data.trainerActionsLocked}
      onNavigate={handlers.goTo}
    />
  );
}
