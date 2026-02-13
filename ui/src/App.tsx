import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout, DashboardLayout } from "@/components/layout";
import { PageLoader, SectionLoader } from "@/components/ui";
import {
  AnalyticsPage,
  ChallengesPage,
  DashboardPage,
  DocumentsPage,
  FeedPage,
  ForgotPasswordPage,
  LandingPage,
  LeaderboardPage,
  LoginPage,
  NotFoundPage,
  NotificationsPage,
  RegisterPage,
  ResetPasswordPage,
  StudyPage,
} from "@/pages";
import { useAuthStore } from "@/stores";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }
        >
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <Suspense fallback={<SectionLoader />}>
                <DashboardLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/study/:documentId" element={<StudyPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
