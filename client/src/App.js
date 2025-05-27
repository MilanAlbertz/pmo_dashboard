import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/global.css';
import './App.css';
import Header from './components/layout/Header/Header';
import Login from './components/auth/Login/Login';
import Home from './pages/Home/Home';
import ProjectDetails from './components/ProjectDetails/ProjectDetails';
import { LanguageProvider } from './contexts/LanguageContext';
import Prospection from './pages/Prospection/Prospection';
import History from './pages/History/History';
import TestData from './components/TestData';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route Component (for login page)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Layout component that conditionally renders the header
const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="App">
      {!isLoginPage && <Header />}
      <div className="app-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public route */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <div>About Page</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <div>Services Page</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contact"
              element={
                <ProtectedRoute>
                  <div>Contact Page</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prospection"
              element={
                <ProtectedRoute>
                  <Prospection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-data"
              element={
                <ProtectedRoute>
                  <TestData />
                </ProtectedRoute>
              }
            />
            {/* Catch all other routes and redirect to home if logged in, or login if not */}
            <Route
              path="*"
              element={
                <Navigate to="/" replace />
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
