import { Navigate, Route, Routes } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";

import StudentDashboard from "./pages/StudentDashboard";
import StudentPantunEditor from "./pages/StudentPantunEditor";
import StudentDrafts from "./pages/StudentDrafts";
import StudentSubmissions from "./pages/StudentSubmissions";

import LecturerDashboard from "./pages/LecturerDashboard";
import LecturerReviewSubmissions from "./pages/LecturerReviewSubmissions";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LoginPage />} />

      {/* Student only */}
      <Route element={<ProtectedRoute allow="student" />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/write-pantun" element={<StudentPantunEditor />} />
        <Route path="/student/drafts" element={<StudentDrafts />} />
        <Route path="/student/submissions" element={<StudentSubmissions />} />
      </Route>

      {/* Lecturer only */}
      <Route element={<ProtectedRoute allow="lecturer" />}>
        <Route path="/lecturer" element={<LecturerDashboard />} />
        <Route path="/lecturer/review" element={<LecturerReviewSubmissions />} />
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allow="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      {/* Unknown URL goes back to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;