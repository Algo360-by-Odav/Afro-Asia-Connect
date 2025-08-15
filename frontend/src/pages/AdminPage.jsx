import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import { AuthContext } from '../contexts/AuthContext';

const AdminPage = () => {
  const { user, isAdmin } = useContext(AuthContext);

  // Redirect non-admin users
  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-page">
      <AdminDashboard />
    </div>
  );
};

// Disable static generation to prevent SSR issues with AuthContext
export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default AdminPage;
