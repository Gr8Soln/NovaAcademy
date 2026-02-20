import { lazy } from "react";

// ── Public ──────────────────────────────────────────────────
export const LandingPage = lazy(() => import("./landing"));
export const NotFoundPage = lazy(() => import("./not-found"));

// ── Auth ────────────────────────────────────────────────────
export const LoginPage = lazy(() => import("./auth/login"));
export const RegisterPage = lazy(() => import("./auth/register"));
export const ForgotPasswordPage = lazy(() => import("./auth/forgot-password"));
export const ResetPasswordPage = lazy(() => import("./auth/reset-password"));
export const ConfirmEmailPage = lazy(() => import("./auth/confirm-email"));

// ── Dashboard ───────────────────────────────────────────────
export const DashboardPage = lazy(() => import("./dashboard/dashboard"));
export const AnalyticsPage = lazy(() => import("./performance/analytics"));

// ── Study ───────────────────────────────────────────────────
export const DocumentsPage = lazy(() => import("./study/documents"));
export const StudyPage = lazy(() => import("./study/study"));

// ── Exam ────────────────────────────────────────────────────
export const ExamHallPage = lazy(() => import("./exam/exam-hall"));

// ── Compete ─────────────────────────────────────────────────
export const LeaderboardPage = lazy(() => import("./compete/leaderboard"));
export const ChallengesPage = lazy(() => import("./compete/challenges"));

// ── Classroom ───────────────────────────────────────────────
export const ClassroomPage = lazy(() => import("./classroom/classroom"));
export const ClassPage = lazy(() => import("./classroom/class"));
export const ClassOverviewPage = lazy(
  () => import("./classroom/class-overview"),
);
export const ClassChatPage = lazy(() => import("./classroom/class-chat"));
export const ClassLibraryPage = lazy(() => import("./classroom/class-library"));
export const ClassStudyPage = lazy(() => import("./classroom/class-study"));
export const ClassQuizPage = lazy(() => import("./classroom/class-quiz"));
export const ClassMembersPage = lazy(
  () => import("./classroom/class-members"),
);

// ── Profile ─────────────────────────────────────────────────
export const ProfilePage = lazy(() => import("./profile/profile"));
