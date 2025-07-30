
import { Link,useNavigate} from 'react-router-dom';
import './Navbar.css';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    // Optional: clear auth tokens, context, etc.
    // localStorage.removeItem('token');
    navigate('/');
  };
  return (
    <div className="sidebar">
      <nav className="nav-links">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        {/* <Link to="/attendancepage" className="nav-link">view Attendance</Link> */}
        <button className="nav-link" onClick={handleLogout}>
          Logout
        </button>


      </nav>
    </div>
  );
};

export default AdminNavbar;
