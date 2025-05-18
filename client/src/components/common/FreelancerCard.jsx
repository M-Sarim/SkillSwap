import { Link } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';
import { truncateString } from '../../utils/helpers';

const FreelancerCard = ({ freelancer, linkTo }) => {
  // Generate star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-5 w-5 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIcon className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="h-5 w-5 text-gray-300" />
        );
      }
    }
    
    return stars;
  };

  return (
    <div className="card card-hover">
      <div className="p-5">
        <div className="flex items-center mb-4">
          <img
            src={freelancer.user?.profileImage || 'https://via.placeholder.com/100'}
            alt={freelancer.user?.name}
            className="h-16 w-16 rounded-full object-cover mr-4"
          />
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              <Link to={linkTo} className="hover:text-primary-600">
                {freelancer.user?.name}
              </Link>
            </h3>
            
            <div className="flex items-center mt-1">
              <div className="flex">
                {renderStars(freelancer.averageRating || 0)}
              </div>
              <span className="ml-1 text-sm text-gray-500">
                ({freelancer.ratings?.length || 0} reviews)
              </span>
            </div>
            
            {freelancer.verified && (
              <span className="inline-flex items-center mt-1 text-xs font-medium text-green-700">
                <svg className="mr-1 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified {freelancer.verificationLevel}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">
          {truncateString(freelancer.bio, 150)}
        </p>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {freelancer.skills.map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Hourly Rate</p>
            <p className="font-medium">${freelancer.hourlyRate}/hr</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed Projects</p>
            <p className="font-medium">{freelancer.completedProjects}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
        <Link
          to={linkTo}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          View Profile →
        </Link>
      </div>
    </div>
  );
};

export default FreelancerCard;
