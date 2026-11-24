import { Route, Routes } from "react-router";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentPantunEditor from "./pages/StudentPantunEditor";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/write-pantun" element={<StudentPantunEditor />} />
      <Route path="/lecturer" element={<LecturerDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;