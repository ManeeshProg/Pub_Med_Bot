import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import SearchPage from './components/SearchPage';
import Profile from './components/Profile';
import History from './components/History';
import Header from './components/Header';
import SemanticSearchPage from './components/SemanticSearchPage';
import GroqHistory from './components/GroqHistory';
import Dashboard from './components/Dashboard';
import ChatbotPage from './components/ChatbotPage';
import { refreshToken } from './utils/auth.js';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('loggedInUser');
  if (!isLoggedIn) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen font-sans flex flex-col">
      <Header onFilterToggle={() => {}} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="ml-56 flex-1 bg-slate-50 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Set up axios interceptors for automatic token refresh
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            console.log('Token expired, attempting to refresh...');
            await refreshToken();
            const newToken = localStorage.getItem('jwt_token');

            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('loggedInUser');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedLayout>
              <Home />
            </ProtectedLayout>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedLayout>
              <SearchPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/semantic-search"
          element={
            <ProtectedLayout>
              <SemanticSearchPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedLayout>
              <History />
            </ProtectedLayout>
          }
        />
        <Route
          path="/history/groq"
          element={
            <ProtectedLayout>
              <GroqHistory />
            </ProtectedLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedLayout>
              <ChatbotPage />
            </ProtectedLayout>
          }
        />
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </Router>
  );
};

export default App;
