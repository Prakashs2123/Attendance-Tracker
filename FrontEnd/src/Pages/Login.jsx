import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuth();

  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post('http://localhost:5000/login', {
      email: email.trim().toLowerCase(),
      password: password.trim()
    });

    // Save to localStorage
    localStorage.setItem("userEmail", res.data.email);
    localStorage.setItem("userId", res.data.id);
    localStorage.setItem("userName", res.data.name);
    localStorage.setItem("userRole", res.data.role);

    // ✅ Update context
    setAuth({
      isLoggedIn: true,
      email: res.data.email,
      role: res.data.role,
    });

    toast.success(res.data.message);
    console.log("Logged-in role:", res.data.role);

    // Navigate
    if (res.data.role === "admin") {
      navigate("/dashboard/admin");
    } else {
      navigate("/dashboard/user");
    }
  } catch (err) {
    if (err.response?.data?.error) {
      toast.error(err.response.data.error);
    } else {
      toast.error("Server error");
    }
  }
};


  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <form className='auth-form' onSubmit={handleLogin}>
          <h1 className="auth-title">Login</h1>
          <div className='input-group'>
            <input
              type='text'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter the email'
              required
            />
          </div>
          <div className='input-group'>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter password'
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>
          <div className="link-small">Forget Password</div>
          <button className='auth-btn' type="submit">Login</button>
          <div className='auth-footer'>
            <p>Don't have an account? <button type="button" onClick={() => navigate('/SignUp')}>Register</button></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
