import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import pages
import MessagingPage from './pages/MessagingPage';
import AdminPage from './pages/AdminPage';
import PaymentsPage from './pages/PaymentsPage';

// Import components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/profile/Profile';
import BusinessDirectory from './components/business/BusinessDirectory';
import NetworkingHub from './components/networking/NetworkingHub';
import MarketInsights from './components/insights/MarketInsights';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Import protected route component
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/messaging" element={
                  <ProtectedRoute>
                    <MessagingPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/business-directory" element={
                  <ProtectedRoute>
                    <BusinessDirectory />
                  </ProtectedRoute>
                } />
                
                <Route path="/networking" element={
                  <ProtectedRoute>
                    <NetworkingHub />
                  </ProtectedRoute>
                } />
                
                <Route path="/market-insights" element={
                  <ProtectedRoute>
                    <MarketInsights />
                  </ProtectedRoute>
                } />
                
                <Route path="/payments" element={
                  <ProtectedRoute>
                    <PaymentsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute adminRequired={true}>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
            
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
