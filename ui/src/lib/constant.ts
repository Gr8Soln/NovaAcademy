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
  classPage: "/class/:classId",
  classChat: "/class/:classId/chat",
  classLibrary: "/class/:classId/library",
  classStudy: "/class/:classId/study",
  classQuiz: "/class/:classId/quiz",
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
