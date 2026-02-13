import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import {
  AuthLayout,
  DashboardLayout,
  QuizzesLayout,
  StudyLayout,
} from "@/components/layout";
import { PageLoader, SectionLoader } from "@/components/ui";
import {
  DashboardPage,
  DocumentsPage,
  ForgotPasswordPage,
  LandingPage,
  LoginPage,
  NotFoundPage,
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
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <Suspense fallback={<SectionLoader />}>
                <StudyLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/study/:documentId" element={<StudyPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <Suspense fallback={<SectionLoader />}>
                <QuizzesLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route path="/quizzes" element={<div>Quizzes coming soon</div>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
