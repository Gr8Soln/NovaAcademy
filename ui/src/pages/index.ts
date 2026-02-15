import { lazy } from "react";

// ── Public ──────────────────────────────────────────────────
export const LandingPage = lazy(() => import("./landing"));
export const NotFoundPage = lazy(() => import("./not-found"));

// ── Auth ────────────────────────────────────────────────────
export const LoginPage = lazy(() => import("./auth/login"));
export const RegisterPage = lazy(() => import("./auth/register"));
export const ForgotPasswordPage = lazy(() => import("./auth/forgot-password"));
export const ResetPasswordPage = lazy(() => import("./auth/reset-password"));

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

