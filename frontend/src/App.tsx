import { Route, Routes } from "react-router";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentPantunEditor from "./pages/StudentPantunEditor";
import StudentDrafts from "./pages/StudentDrafts";
import StudentSubmissions from "./pages/StudentSubmissions";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/write-pantun" element={<StudentPantunEditor />} />
      <Route path="/student/drafts" element={<StudentDrafts />} />
      <Route path="/lecturer" element={<LecturerDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/student/submissions" element={<StudentSubmissions />} />
    </Routes>
  );
}

export default App;