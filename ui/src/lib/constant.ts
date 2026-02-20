export const pages = {
  // Auth pages
  home: "/",
  login: "/auth/login",
  register: "/auth/register",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  confirmEmail: "/auth/confirm-email",

  // Dashboard pages
  dashboard: "/dashboard",
  analytics: "/dashboard/analytics",

  // Classroom pages
  classroom: "/classroom",
  classPage: "/class/:classCode",
  classChat: "/class/:classCode/chat",
  classLibrary: "/class/:classCode/library",
  classStudy: "/class/:classCode/study",
  classQuiz: "/class/:classCode/quiz",
  classParticipants: "/class/:classCode/participants",
  documents: "/classroom/documents",
  study: "/classroom/study/:documentId",
  examHall: "/classroom/exam-hall",
  leaderboard: "/classroom/leaderboard",
  challenges: "/classroom/challenges",

  // Profile
  profile: "/profile",
};

// export const displayName = "NovaAcademy"
export const displayName = "NovaAcademy";
export const displayDescription =
  " AI-powered study platform that helps students learn smarter with personalized summaries, quizzes, and social learning.";
export const socialLinks = {
  twitter: "https://twitter.com/gr8soln",
  instagram: "https://www.instagram.com/gr8soln",
  linkedin: "https://www.linkedin.com/in/gr8soln",
  github: "https://github.com/gr8soln",
};
