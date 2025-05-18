import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';
import { formatDate, formatCurrency, getStatusBadgeClass } from '../../utils/helpers';

const BidCard = ({ bid, onAccept, onReject, onCounter, isClient }) => {
  const [showFullProposal, setShowFullProposal] = useState(false);
  const statusClass = getStatusBadgeClass(bid.status);
  
  // Generate star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIcon className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }
    
    return stars;
  };

  return (
    <div className="card card-hover">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <img
              src={bid.freelancer.user?.profileImage || 'https://via.placeholder.com/50'}
              alt={bid.freelancer.user?.name}
              className="h-12 w-12 rounded-full object-cover mr-3"
            />
            
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                <Link to={`/freelancers/${bid.freelancer._id}`} className="hover:text-primary-600">
                  {bid.freelancer.user?.name}
                </Link>
              </h3>
              
              <div className="flex items-center mt-1">
                <div className="flex">
                  {renderStars(bid.freelancer.averageRating || 0)}
                </div>
                <span className="ml-1 text-xs text-gray-500">
                  ({bid.freelancer.ratings?.length || 0})
                </span>
                
                {bid.freelancer.verified && (
                  <span className="ml-2 inline-flex items-center text-xs font-medium text-green-700">
                    <svg className="mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <span className={`badge ${statusClass}`}>
            {bid.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Bid Amount</p>
            <p className="font-medium">{formatCurrency(bid.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Time</p>
            <p className="font-medium">{bid.deliveryTime} days</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Proposal</h4>
          <p className="text-gray-600 text-sm">
            {showFullProposal ? bid.proposal : `${bid.proposal.substring(0, 150)}${bid.proposal.length > 150 ? '...' : ''}`}
          </p>
          {bid.proposal.length > 150 && (
            <button
              onClick={() => setShowFullProposal(!showFullProposal)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1"
            >
              {showFullProposal ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        
        {bid.counterOffer && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Counter Offer</h4>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-medium">{formatCurrency(bid.counterOffer.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Delivery Time</p>
                <p className="font-medium">{bid.counterOffer.deliveryTime} days</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{bid.counterOffer.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              Sent on {formatDate(bid.counterOffer.date)}
            </p>
          </div>
        )}
        
        {bid.rejectionReason && (
          <div className="mb-4 p-3 bg-red-50 rounded-md border border-red-100">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Rejection Reason</h4>
            <p className="text-gray-600 text-sm">{bid.rejectionReason}</p>
          </div>
        )}
        
        <div className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
          <span className="font-medium">Submitted: </span>
          {formatDate(bid.createdAt)}
        </div>
      </div>
      
      {isClient && bid.status === 'Pending' && (
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between">
          <div>
            <button
              onClick={() => onAccept(bid._id)}
              className="mr-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Accept Bid
            </button>
            <button
              onClick={() => onReject(bid._id)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Reject
            </button>
          </div>
          <button
            onClick={() => onCounter(bid._id)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Counter Offer
          </button>
        </div>
      )}
    </div>
  );
};

export default BidCard;
