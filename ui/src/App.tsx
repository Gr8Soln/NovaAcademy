import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout, DashboardLayout } from "@/components/layout";
import { PageLoader } from "@/components/ui";
import {
  AnalyticsPage,
  ChallengesPage,
  DashboardPage,
  DocumentsPage,
  ExamHallPage,
  ForgotPasswordPage,
  LandingPage,
  LeaderboardPage,
  LoginPage,
  NotFoundPage,
  RegisterPage,
  ResetPasswordPage,
  StudyPage,
} from "@/pages";
import { useAuthStore } from "@/stores";
import { pages } from "@/lib/constant";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to={pages.login} replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return <Navigate to={pages.dashboard} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route
          path="auth"
          element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }
        >
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Dashboard */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Classroom */}
        <Route
          path="classroom"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="study/:documentId" element={<StudyPage />} />
          <Route path="exam-hall" element={<ExamHallPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="challenges" element={<ChallengesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
