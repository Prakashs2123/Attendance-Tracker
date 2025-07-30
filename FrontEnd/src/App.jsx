import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './Pages/Login';
import SignUp from './Pages/SignUp';
import Layout from './Layout/Layout';
import AdminDashboard from './Pages/admin/AdminDashboard';
import UserDashboard from './Pages/user/UserDashboard';
import MarkAttendance from './Pages/user/MarkAttendance';
import './index.css';
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/dashboard" element={<Layout />}>
  <Route path="admin" element={<AdminDashboard />} />
  <Route path="user" element={<UserDashboard />} />
  <Route path="mark-attendance" element={<MarkAttendance />} /> {/* ✅ fixed */}
  <Route index element={<Navigate to="/dashboard/user" />} />
</Route>

      </Routes>
    </AuthProvider>
  );
}

export default App;
