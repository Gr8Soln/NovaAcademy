import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "@/components/layout/dashboard";
import DashboardPage from "@/pages/dashboard/dashboard";
import DocumentsPage from "@/pages/study/documents";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import StudyPage from "@/pages/study/study";
import { useAuthStore } from "@/stores";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/study/:documentId" element={<StudyPage />} />
      </Route>
    </Routes>
  );
}
