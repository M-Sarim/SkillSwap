import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
        <div className="text-center">
          <h1 className="text-8xl font-extrabold text-secondary-600">404</h1>
          <div className="h-1 w-16 bg-secondary-500 mx-auto my-6 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h2>
          <p className="text-gray-600 text-sm mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <Button to="/" variant="primary">
            Go back home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
