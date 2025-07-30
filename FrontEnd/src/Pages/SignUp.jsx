import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import './Login.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/signup', {
        email,
        password,
        confirmPassword,
      });

      alert(response.data.message); 
      navigate('/Login'); 
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error); 
      } else {
        alert('Server error. Please try again.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <form className='auth-form' onSubmit={handleSubmit}>
          <h1 className="auth-title">Sign up</h1>
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
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>

          <div className='input-group'>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Confirm password'
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </span>
          </div>
          <button className='auth-btn' type="submit">Sign up</button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
