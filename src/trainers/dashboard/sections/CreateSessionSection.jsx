import { FiAlertCircle, FiCalendar, FiCheckCircle, FiImage, FiUploadCloud } from "react-icons/fi";
import { subtitleSuggestions } from "../../create-session/createSessionConfig";
import { formatTime } from "../sessionDisplayUtils";

export default function CreateSessionSection({
  form,
  formErrors,
  message,
  error,
  editingSessionId,
  loadingCourses,
  submitting,
  trainerActionsLocked,
  courseTitleSuggestions,
  combinedCategorySuggestions,
  fieldClass,
  onSubmit,
  onCancelEditing,
  onChange,
  onCourseTitleChange,
  onThumbnailChange,
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00342b] text-white">
            <FiCalendar className="text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">
              {editingSessionId ? "Edit daily recurring session" : "Create daily recurring session"}
            </h2>
            <p className="text-sm text-slate-500">
              One setup creates a daily class. Trainers can pause it or cancel only today's class later.
            </p>
          </div>
        </div>
        {editingSessionId ? (
          <button
            type="button"
            onClick={onCancelEditing}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-600 transition-colors hover:border-red-200 hover:text-red-700"
          >
            Cancel edit
          </button>
        ) : null}
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

      <fieldset
        disabled={trainerActionsLocked || submitting}
        className="mt-6 grid grid-cols-1 gap-4 disabled:opacity-60 sm:grid-cols-2"
      >
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:items-center">
            <div className="aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 bg-white">
              {form.thumbnailPreview ? (
                <img
                  src={form.thumbnailPreview}
                  alt="Session thumbnail preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-600 text-white">
                  <FiImage className="text-4xl opacity-80" />
                  <div className="mt-2 text-sm font-extrabold">Thumbnail preview</div>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Session thumbnail
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Add a thumbnail for this daily live session. It helps students identify the course session quickly.
              </p>
              <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 transition-colors hover:border-[#006b58]">
                <FiUploadCloud />
                Upload thumbnail
                <input type="file" accept="image/*" onChange={onThumbnailChange} className="hidden" />
              </label>
              <p className="mt-2 text-xs text-slate-500">Image only. Maximum size 5 MB.</p>
            </div>
          </div>
        </div>

        <label className="sm:col-span-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Course</span>
          <input
            name="courseTitle"
            value={form.courseTitle}
            onChange={onCourseTitleChange}
            list="trainer-course-options"
            placeholder={loadingCourses ? "Loading courses..." : "Select or type course name"}
            className={fieldClass("courseTitle", "mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm outline-none")}
          />
          <datalist id="trainer-course-options">
            {courseTitleSuggestions.map((title) => (
              <option key={title} value={title} />
            ))}
          </datalist>
          {formErrors.courseTitle ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.courseTitle}</p> : null}
          <p className="mt-1 text-xs text-slate-500">
            Select a backend course or type a new course name manually.
          </p>
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Session title</span>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="React Live Class"
            className={fieldClass("title", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
          />
          {formErrors.title ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.title}</p> : null}
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Category</span>
          <input
            name="category"
            value={form.category}
            onChange={onChange}
            list="trainer-category-options"
            placeholder="Select or type category"
            className={fieldClass("category", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
          />
          <datalist id="trainer-category-options">
            {combinedCategorySuggestions.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Subtitle</span>
          <input
            name="subtitle"
            value={form.subtitle}
            onChange={onChange}
            list="trainer-subtitle-options"
            placeholder="Daily practical session"
            className={fieldClass("subtitle", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
          />
          <datalist id="trainer-subtitle-options">
            {subtitleSuggestions.map((subtitle) => (
              <option key={subtitle} value={subtitle} />
            ))}
          </datalist>
        </label>

        <label className="sm:col-span-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            placeholder="Live session description"
            className={fieldClass("description", "mt-1 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none")}
          />
          {formErrors.description ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.description}</p> : null}
        </label>

        <label className="sm:col-span-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Instructions / Notes for Students</span>
          <textarea
            name="trainerInstructions"
            value={form.trainerInstructions || ""}
            onChange={onChange}
            rows={2}
            placeholder="e.g., Classes will be conducted only from Monday to Thursday"
            className={fieldClass("trainerInstructions", "mt-1 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none")}
          />
          {formErrors.trainerInstructions ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.trainerInstructions}</p> : null}
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Start time</span>
          <input
            name="startTime"
            type="time"
            value={form.startTime}
            onChange={onChange}
            className={fieldClass("startTime", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
          />
          {formErrors.startTime ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.startTime}</p> : null}
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">End time</span>
          <input
            name="endTime"
            type="time"
            value={form.endTime}
            onChange={onChange}
            className={fieldClass("endTime", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
          />
          {formErrors.endTime ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.endTime}</p> : null}
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Timezone</span>
          <select
            name="timezone"
            value={form.timezone}
            onChange={onChange}
            className={fieldClass("timezone", "mt-1 h-11 w-full rounded-xl bg-white px-4 text-sm outline-none")}
          >
            <option value="Asia/Kolkata">Asia/Kolkata</option>
          </select>
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Meeting link</span>
          <input
            name="meetingLink"
            type="url"
            value={form.meetingLink}
            onChange={onChange}
            placeholder="https://meet.google.com/xxx"
            className={fieldClass("meetingLink", "mt-1 h-11 w-full rounded-xl px-4 text-sm outline-none")}
          />
          {formErrors.meetingLink ? <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.meetingLink}</p> : null}
        </label>

        {/* Recurrence Settings Group */}
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 p-4 bg-slate-50">
          <label className="flex items-center gap-2 select-none">
            <input
              type="checkbox"
              name="isRecurring"
              checked={true}
              disabled={true}
              className="h-5 w-5 rounded border-slate-300 text-[#00342b] focus:ring-[#00342b] opacity-80 cursor-not-allowed"
            />
            <div>
              <span className="text-sm font-extrabold text-slate-800">Weekly Recurring Session <span className="text-[#006b58] font-bold">(Mandatory)</span></span>
              <p className="text-xs text-slate-500">All live classes must run on weekly recurring schedule days.</p>
            </div>
          </label>

          {form.isRecurring && (
            <div className="mt-4 border-t border-slate-200/60 pt-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 block mb-2">
                Recurring Days
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "S", value: 0, fullName: "Sunday" },
                  { label: "M", value: 1, fullName: "Monday" },
                  { label: "T", value: 2, fullName: "Tuesday" },
                  { label: "W", value: 3, fullName: "Wednesday" },
                  { label: "T", value: 4, fullName: "Thursday" },
                  { label: "F", value: 5, fullName: "Friday" },
                  { label: "S", value: 6, fullName: "Saturday" },
                ].map((day) => {
                  const isSelected = (form.recurringDays || []).includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const currentDays = form.recurringDays || [];
                        const nextDays = currentDays.includes(day.value)
                          ? currentDays.filter((d) => d !== day.value)
                          : [...currentDays, day.value].sort();
                        
                        // Trigger synthetic event for recurringDays
                        onChange({
                          target: {
                            name: "recurringDays",
                            value: nextDays,
                            type: "custom",
                          },
                        });

                        // Also set recurrenceType to "weekly"
                        onChange({
                          target: {
                            name: "recurrenceType",
                            value: "weekly",
                            type: "custom",
                          },
                        });
                      }}
                      title={day.fullName}
                      className={`h-10 w-10 rounded-full text-sm font-bold flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#00342b] text-white shadow-sm ring-2 ring-emerald-500/20"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              {formErrors.recurringDays ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{formErrors.recurringDays}</p>
              ) : null}

              {/* Recurrence End Date Input */}
              <div className="mt-4 border-t border-slate-200/60 pt-4">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 block mb-1">
                    Recurrence End Date <span className="text-[#006b58] font-bold">(Required)</span>
                  </span>
                  <input
                    name="recurrenceEndDate"
                    type="date"
                    value={form.recurrenceEndDate || ""}
                    onChange={onChange}
                    className={fieldClass("recurrenceEndDate", "mt-1 h-11 w-full max-w-xs rounded-xl bg-white px-4 text-sm outline-none")}
                  />
                  {formErrors.recurrenceEndDate ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.recurrenceEndDate}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    Select a date when this recurring session should stop generating occurrences.
                  </p>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-950">
          {form.isRecurring
            ? `Recurrence: Weekly (${
                form.recurringDays && form.recurringDays.length > 0
                  ? form.recurringDays
                      .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                      .join(", ")
                  : "No days selected"
              })${form.recurrenceEndDate ? ` until ${form.recurrenceEndDate}` : ""}, `
            : "Recurrence: One-time session, "}
          {form.startTime && form.endTime
            ? `${formatTime(form.startTime)} to ${formatTime(form.endTime)}`
            : "time not set"}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={submitting || trainerActionsLocked}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00342b] text-sm font-extrabold text-white transition-colors hover:bg-[#004d40] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <FiCheckCircle className="text-lg" />
        )}
        {submitting
          ? editingSessionId
            ? "Updating recurring session..."
            : "Creating recurring session..."
          : editingSessionId
            ? "Update recurring session"
            : "Create recurring session"}
      </button>
    </form>
  );
}
