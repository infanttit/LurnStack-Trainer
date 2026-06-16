export const initialSessionForm = {
  courseId: "",
  courseTitle: "",
  category: "",
  title: "",
  subtitle: "",
  description: "",
  startTime: "",
  endTime: "",
  timezone: "Asia/Kolkata",
  meetingLink: "",
  thumbnailPreview: "",
  thumbnailFile: null,
  isRecurring: true,
  recurrenceType: "weekly",
  trainerInstructions: "",
  recurringDays: [],
  enableWhatsApp: true,
  whatsappTemplateName: "",
  whatsappCustomTitle: "",
  whatsappButtonUrl: "",
  recurrenceEndDate: "",
};

export const sessionFieldLabels = {
  courseTitle: "Course",
  title: "Session title",
  description: "Description",
  startTime: "Start time",
  endTime: "End time",
  meetingLink: "Meeting link",
  recurrenceEndDate: "Recurrence End Date",
};

export const categorySuggestions = [
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Web Development",
  "Mobile App Development",
  "Programming",
  "Database",
  "DevOps",
  "Cloud Computing",
  "UI/UX Design",
];

export const subtitleSuggestions = [
  "Daily practical session",
  "Live coding practice",
  "Project-based training",
  "Interview preparation session",
  "Beginner friendly live class",
  "Advanced implementation session",
  "Hands-on doubt clearing session",
];
