import { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute:', {
      path: location.pathname,
      isAuthenticated,
      user,
      allowedRoles
    });
  }, [location.pathname, isAuthenticated, user, allowedRoles]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Special handling for admin routes
  if (location.pathname.startsWith('/admin')) {
    // If we have a token but no user object yet, allow rendering while AuthContext loads
    if (!user && localStorage.getItem('token')) {
      console.log('Token exists but user not loaded yet, allowing render');
      return children;
    }
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Check if user object exists
  if (!user) {
    console.error('User object is null despite being authenticated');
    return <Navigate to="/login" />;
  }

  // If roles are specified and user's role is not included, redirect to appropriate dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log(`User role ${user.role} not in allowed roles ${allowedRoles.join(', ')}`);
    switch (user.role) {
      case 'client':
        return <Navigate to="/client" />;
      case 'freelancer':
        return <Navigate to="/freelancer" />;
      case 'admin':
        return <Navigate to="/admin" />;
      default:
        return <Navigate to="/" />;
    }
  }

  // If authenticated and authorized, render the children
  return children;
};

export default ProtectedRoute;
