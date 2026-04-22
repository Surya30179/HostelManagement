import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import ApproverDashboard from "./pages/ApproverDashboard";
import SecurityDashboard from "./pages/SecurityDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect cleanly based on their actual role if they try to access wrong route
    if (user.role === "STUDENT") return <Navigate to="/" replace />;
    if (user.role === "SECURITY_GUARD") return <Navigate to="/scan" replace />;
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to="/approvals" replace />;
  }

  return children;
}

function RoleRouter() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === "STUDENT") return <StudentDashboard />;
  if (user.role === "SECURITY_GUARD") return <SecurityDashboard />;
  if (user.role === "ADMIN") return <AdminDashboard />;
  return <Navigate to="/approvals" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<RoleRouter />} />
          
          <Route 
            path="/approvals" 
            element={
              <ProtectedRoute allowedRoles={["COORDINATOR", "HOD", "PRINCIPAL", "WARDEN"]}>
                <ApproverDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/scan" 
            element={
              <ProtectedRoute allowedRoles={["SECURITY_GUARD"]}>
                <SecurityDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
