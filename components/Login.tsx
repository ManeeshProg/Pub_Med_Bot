import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/login', { email, password });
      const { token, user } = res.data;
      // Persist auth info consistently
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      // Signal auth state change for same-tab
      window.dispatchEvent(new Event('user-auth-change'));
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2a1 1 0 001 1h14a1 1 0 001-1v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <h2 className="text-2xl font-bold text-blue-700 mb-1">Welcome Back!</h2>
          <p className="text-slate-500 text-sm">Login to your account to continue</p>
        </div>
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-lg"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-lg"
          />
          <button type="submit" className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors text-lg">Login</button>
        </form>
        {error && <p className="mt-4 text-red-500 font-medium">{error}</p>}
        <p className="mt-6 text-slate-600 text-sm">Don't have an account? <a href="/register" className="text-blue-600 font-semibold hover:underline">Register</a></p>
      </div>
    </div>
  );
};

export default Login;
