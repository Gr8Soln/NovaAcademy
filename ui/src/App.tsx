import Layout from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import DocumentsPage from "@/pages/DocumentsPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import StudyPage from "@/pages/StudyPage";
import { useAuthStore } from "@/stores/authStore";
import { Navigate, Route, Routes } from "react-router-dom";

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
