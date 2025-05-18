import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
  });

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Login form submitted with:', values.email);

      // We'll use the normal login flow for all users including admins
      // This ensures we're using real database authentication
      console.log('Attempting login with credentials');

      // Normal login flow for non-admin users
      const result = await login(values.email, values.password);
      console.log('Login result:', result);

      // Get the user's role from the response
      const userRole = result?.data?.user?.role || 'client';
      console.log('User role after login:', userRole);

      // Store the current user role in localStorage for development
      localStorage.setItem('current_user_role', userRole);
      localStorage.setItem('current_user_id', result?.data?.user?._id || 'unknown');

      // Redirect based on user role
      let dashboardPath;
      switch (userRole) {
        case 'client':
          dashboardPath = '/client';
          break;
        case 'freelancer':
          dashboardPath = '/freelancer';
          break;
        case 'admin':
          dashboardPath = '/admin';
          break;
        default:
          dashboardPath = '/';
      }

      console.log('Redirecting to:', dashboardPath);

      // Navigate to the appropriate dashboard
      navigate(dashboardPath, { replace: true });

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || err.response?.data?.message || 'Failed to login. Please try again.');

      // Clear any previous login data
      localStorage.removeItem('token');
      localStorage.removeItem('current_user_role');
      localStorage.removeItem('current_user_id');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6 transform transition-all duration-300 hover:shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            Welcome back
          </h2>
          <div className="h-1 w-12 bg-secondary-500 mx-auto my-3 rounded-full"></div>
          <p className="text-center text-sm text-gray-600 mt-2">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-secondary-600 hover:text-secondary-700 transition-colors duration-200">
              Sign up
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-2 border-red-400 p-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 text-sm transition-colors duration-200"
                />
                <ErrorMessage name="email" component="p" className="mt-1 text-xs text-red-600" />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="text-xs">
                    <Link to="/forgot-password" className="font-medium text-secondary-600 hover:text-secondary-700 transition-colors duration-200">
                      Forgot?
                    </Link>
                  </div>
                </div>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 text-sm transition-colors duration-200"
                />
                <ErrorMessage name="password" component="p" className="mt-1 text-xs text-red-600" />
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Sign in'}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? <a href="mailto:support@skillswap.com" className="font-medium text-secondary-600 hover:text-secondary-700 transition-colors duration-200">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
