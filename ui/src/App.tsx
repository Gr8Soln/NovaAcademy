import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AuthLayout from "@/components/layout/auth";
import DashboardLayout from "@/components/layout/dashboard";
import StudyLayout from "@/components/layout/study";
import { PageLoader } from "@/components/ui";
import { pages } from "@/lib/constant";
import {
  ChallengesPage,
  ClassChatPage,
  ClassLibraryPage,
  ClassMembersPage,
  ClassOverviewPage,
  ClassPage,
  ClassQuizPage,
  ClassroomPage,
  ClassStudyPage,
  ConfirmEmailPage,
  DashboardPage,
  DocumentsPage,
  ExamHallPage,
  ForgotPasswordPage,
  LandingPage,
  LeaderboardPage,
  LoginPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  StudyPage,
} from "@/pages";
import { useAuthStore } from "@/stores";

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
          <Route path="confirm-email" element={<ConfirmEmailPage />} />
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
        </Route>

        {/* Study Experience (Immersive) */}
        <Route
          path="study"
          element={
            <ProtectedRoute>
              <StudyLayout />
            </ProtectedRoute>
          }
        >
          <Route path=":documentId" element={<StudyPage />} />
          <Route path="class/:classId" element={<ClassStudyPage />} />
          <Route path="class/:classId/:documentId" element={<ClassStudyPage />} />
        </Route>

        {/* Classroom & Personal Library */}
        <Route
          path="classroom"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClassroomPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="exam-hall" element={<ExamHallPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="challenges" element={<ChallengesPage />} />
        </Route>

        {/* Class detail — nested routes for each section */}
        <Route
          path="class/:classId"
          element={
            <ProtectedRoute>
              <ClassPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClassOverviewPage />} />
          <Route path="chat" element={<ClassChatPage />} />
          <Route path="library" element={<ClassLibraryPage />} />
          <Route path="quiz" element={<ClassQuizPage />} />
          <Route path="participants" element={<ClassMembersPage />} />
        </Route>

        {/* Profile */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
