import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import useApi from '../../hooks/useApi';
import { formatDate } from '../../utils/helpers';

const VerifyFreelancers = () => {
  const { get, put, loading } = useApi();
  const [freelancers, setFreelancers] = useState([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [verificationLevel, setVerificationLevel] = useState('Basic');
  const [filterStatus, setFilterStatus] = useState('pending');

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        console.log('Fetching freelancers with status:', filterStatus);

        // Use the correct API endpoint
        const response = await get('/admin/verify-freelancers', { status: filterStatus });
        console.log('API response:', response);

        if (response.success) {
          // Ensure each freelancer has a verificationDocuments array
          const freelancersWithDocs = response.data.freelancers.map(freelancer => ({
            ...freelancer,
            verificationDocuments: freelancer.verificationDocuments || []
          }));

          console.log('Processed freelancers:', freelancersWithDocs);
          setFreelancers(freelancersWithDocs);
        }
      } catch (err) {
        console.error('Error fetching freelancers:', err);
        // Error handling is now in the useApi hook

        // For development, set some mock data
        setFreelancers([
          {
            _id: '1',
            user: { name: 'Test Freelancer', email: 'test@example.com' },
            skills: ['JavaScript', 'React'],
            verified: false,
            verificationLevel: 'None',
            verificationDocuments: []
          }
        ]);
      }
    };

    fetchFreelancers();
  }, [get, filterStatus]);

  const handleVerify = async (freelancerId, approve) => {
    try {
      console.log('Verifying freelancer:', freelancerId, 'Approve:', approve, 'Level:', verificationLevel);

      // Use the correct API endpoint and parameters
      const response = await put(`/admin/verify-freelancers/${freelancerId}`, {
        verified: approve,
        verificationLevel: approve ? verificationLevel : 'None'
      });

      if (response.success) {
        // Update freelancers list
        setFreelancers(prev =>
          prev.map(freelancer =>
            freelancer._id === freelancerId
              ? {
                  ...freelancer,
                  verified: approve,
                  verificationLevel: approve ? verificationLevel : 'None'
                }
              : freelancer
          )
        );

        // Close detail view if the current freelancer was verified
        if (selectedFreelancer && selectedFreelancer._id === freelancerId) {
          setSelectedFreelancer(null);
        }

        // Refresh the list after a short delay
        setTimeout(() => {
          get('/admin/verify-freelancers', { status: filterStatus })
            .then(response => {
              if (response.success) {
                setFreelancers(response.data.freelancers);
              }
            })
            .catch(err => {
              console.error('Error refreshing freelancers:', err);
            });
        }, 1000);
      }
    } catch (err) {
      console.error('Error verifying freelancer:', err);
      // Error handling is now in the useApi hook
    }
  };

  const handleViewDetails = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setVerificationLevel(freelancer.verificationLevel === 'None' ? 'Basic' : freelancer.verificationLevel);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Verify Freelancers</h1>

        <div className="flex items-center space-x-4">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="pending">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Freelancers</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex space-x-6">
        {/* Freelancers List */}
        <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${selectedFreelancer ? 'w-1/2' : 'w-full'}`}>
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Freelancers</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'pending' ? 'Freelancers awaiting verification' :
               filterStatus === 'verified' ? 'Verified freelancers' :
               filterStatus === 'rejected' ? 'Rejected freelancers' : 'All freelancers'}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : freelancers.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {freelancers.map((freelancer) => (
                <li
                  key={freelancer._id}
                  className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${
                    selectedFreelancer && selectedFreelancer._id === freelancer._id ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => handleViewDetails(freelancer)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {freelancer.user.profileImage ? (
                          <img
                            src={freelancer.user.profileImage}
                            alt={freelancer.user.name}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-800 font-medium text-sm">
                              {freelancer.user && freelancer.user.name ? freelancer.user.name.charAt(0).toUpperCase() : 'F'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{freelancer.user && freelancer.user.name ? freelancer.user.name : 'Freelancer'}</div>
                        <div className="text-sm text-gray-500">{freelancer.user && freelancer.user.email ? freelancer.user.email : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        freelancer.verified
                          ? 'bg-green-100 text-green-800'
                          : freelancer.verificationLevel === 'None'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {freelancer.verified
                          ? freelancer.verificationLevel
                          : freelancer.verificationLevel === 'None'
                            ? 'Pending'
                            : 'Rejected'}
                      </span>
                      <button
                        type="button"
                        className="ml-4 text-gray-400 hover:text-gray-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(freelancer);
                        }}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No freelancers found</p>
            </div>
          )}
        </div>

        {/* Freelancer Details */}
        {selectedFreelancer && (
          <div className="w-1/2 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Freelancer Details</h3>
              <p className="mt-1 text-sm text-gray-500">
                Review documents and verify the freelancer
              </p>
            </div>

            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  {selectedFreelancer.user.profileImage ? (
                    <img
                      src={selectedFreelancer.user.profileImage}
                      alt={selectedFreelancer.user.name}
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-800 font-medium text-lg">
                        {selectedFreelancer.user && selectedFreelancer.user.name ? selectedFreelancer.user.name.charAt(0).toUpperCase() : 'F'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{selectedFreelancer.user && selectedFreelancer.user.name ? selectedFreelancer.user.name : 'Freelancer'}</h4>
                  <p className="text-sm text-gray-500">{selectedFreelancer.user && selectedFreelancer.user.email ? selectedFreelancer.user.email : ''}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedFreelancer.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Verification Documents</h4>
                {selectedFreelancer.verificationDocuments && selectedFreelancer.verificationDocuments.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {selectedFreelancer.verificationDocuments.map((doc) => (
                      <li key={doc._id || doc.documentType} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name || doc.documentType}</p>
                            <p className="text-xs text-gray-500">
                              {(doc.type || doc.documentType || "Document").charAt(0).toUpperCase() +
                               (doc.type || doc.documentType || "Document").slice(1).replace('_', ' ')} •
                              Uploaded {formatDate(doc.uploadDate)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 py-2">No verification documents uploaded</p>
                )}
              </div>

              {!selectedFreelancer.verified && (
                <div className="mt-6">
                  <label htmlFor="verificationLevel" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Level
                  </label>
                  <select
                    id="verificationLevel"
                    value={verificationLevel}
                    onChange={(e) => setVerificationLevel(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Verified">Verified</option>
                    <option value="Premium">Premium</option>
                  </select>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => handleVerify(selectedFreelancer._id, false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2 text-red-500" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(selectedFreelancer._id, true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyFreelancers;
