import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-radial from-white to-neutral-50 flex flex-col items-center justify-center py-16 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">SkillSwap</span>
          </h1>

          <p className="text-neutral-600 text-lg mb-8 leading-relaxed">
            Connect with skilled freelancers and find exciting projects in our modern marketplace
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-soft border border-neutral-100 p-8 mb-10 transform transition-all duration-150 hover:shadow-soft-lg">
          <div className="space-y-4 mb-8">
            <Link
              to="/register"
              className="flex items-center justify-center w-full py-3.5 px-6 text-white bg-gradient-to-r from-secondary-600 to-secondary-500 hover:from-secondary-700 hover:to-secondary-600 rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 font-medium"
            >
              Create an account
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center w-full py-3.5 px-6 text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-2xl transition-colors duration-150 font-medium"
            >
              Sign in to your account
            </Link>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <p className="text-neutral-500 text-sm text-center">Join our growing community of freelancers and clients</p>
          </div>
        </div>

        <p className="text-neutral-500 text-xs text-center">
          By signing up, you agree to our <a href="#" className="text-secondary-600 hover:underline">Terms of Service</a> and <a href="#" className="text-secondary-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Home;
