import { Outlet } from 'react-router-dom';
import UserHeader from '../component/Header/userHeader';
import AdminHeader from '../component/Header/AdminHeader';
import UserNavbar from '../component/Navbar/UserNavbar';
import AdminNavbar from '../component/Navbar/AdminNavbar';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { auth } = useAuth();
  const isAdmin = auth?.role === 'admin';

  return (
    <div style={{ overflowX: 'hidden' }}>
      {isAdmin ? <AdminHeader /> : <UserHeader />}

      <div style={{ display: 'flex', marginTop: '60px' }}>
        <div style={{ width: '220px', flexShrink: 0 }}>
          {isAdmin ? <AdminNavbar /> : <UserNavbar />}
        </div>

        <div style={{ flex: 1, padding: '10px', minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
