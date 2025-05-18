import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import useApi from '../../hooks/useApi';

const Freelancers = () => {
  const { get, loading } = useApi();
  const [freelancers, setFreelancers] = useState([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skills: [],
    minRating: 0,
    maxHourlyRate: null,
    verified: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const response = await get('/freelancers');

        if (response.success) {
          setFreelancers(response.data.freelancers);
          setFilteredFreelancers(response.data.freelancers);

          // Extract unique skills from all freelancers
          const skills = new Set();
          response.data.freelancers.forEach(freelancer => {
            freelancer.skills.forEach(skill => skills.add(skill));
          });

          setAvailableSkills(Array.from(skills));
        }
      } catch (error) {
        console.error('Error fetching freelancers:', error);
      }
    };

    fetchFreelancers();
  }, [get]);

  useEffect(() => {
    // Apply filters and search
    let results = [...freelancers];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        freelancer =>
          freelancer.user.name.toLowerCase().includes(term) ||
          freelancer.skills.some(skill => skill.toLowerCase().includes(term)) ||
          (freelancer.bio && freelancer.bio.toLowerCase().includes(term))
      );
    }

    // Apply skill filters
    if (filters.skills.length > 0) {
      results = results.filter(
        freelancer => filters.skills.some(skill => freelancer.skills.includes(skill))
      );
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      results = results.filter(
        freelancer => (freelancer.averageRating || 0) >= filters.minRating
      );
    }

    // Apply hourly rate filter
    if (filters.maxHourlyRate) {
      results = results.filter(
        freelancer => freelancer.hourlyRate <= filters.maxHourlyRate
      );
    }

    // Apply verification filter
    if (filters.verified) {
      results = results.filter(freelancer => freelancer.verified);
    }

    setFilteredFreelancers(results);
  }, [freelancers, searchTerm, filters]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSkillToggle = (skill) => {
    setFilters(prev => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];

      return { ...prev, skills };
    });
  };

  const handleRatingChange = (rating) => {
    setFilters(prev => ({ ...prev, minRating: rating }));
  };

  const handleHourlyRateChange = (e) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setFilters(prev => ({ ...prev, maxHourlyRate: value }));
  };

  const handleVerifiedChange = (e) => {
    setFilters(prev => ({ ...prev, verified: e.target.checked }));
  };

  const resetFilters = () => {
    setFilters({
      skills: [],
      minRating: 0,
      maxHourlyRate: null,
      verified: false
    });
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Freelancers</h1>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search by name, skills, or bio"
            />
          </div>

          <div className="flex items-center ml-0 md:ml-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-gray-400" />
              Filters
            </button>

            {(filters.skills.length > 0 || filters.minRating > 0 || filters.maxHourlyRate || filters.verified) && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Skills Filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                <div className="max-h-48 overflow-y-auto">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center mb-2">
                      <input
                        id={`skill-${skill}`}
                        type="checkbox"
                        checked={filters.skills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`skill-${skill}`} className="ml-2 text-sm text-gray-700">
                        {skill}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Minimum Rating</h3>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingChange(rating)}
                      className={`p-1 rounded-md ${
                        filters.minRating >= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <StarIcon className="h-6 w-6 fill-current" />
                    </button>
                  ))}

                  {filters.minRating > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRatingChange(0)}
                      className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Other Filters */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Max Hourly Rate ($)</h3>
                  <input
                    type="number"
                    value={filters.maxHourlyRate || ''}
                    onChange={handleHourlyRateChange}
                    min="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Any rate"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="verified-only"
                    type="checkbox"
                    checked={filters.verified}
                    onChange={handleVerifiedChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="verified-only" className="ml-2 text-sm text-gray-700">
                    Verified freelancers only
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Freelancers List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredFreelancers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No freelancers found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFreelancers.map((freelancer) => (
            <div key={freelancer._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-4">
                      {freelancer.user && freelancer.user.name ? freelancer.user.name.charAt(0) : 'F'}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{freelancer.user && freelancer.user.name ? freelancer.user.name : 'Freelancer'}</h3>
                      <p className="text-sm text-gray-500">{freelancer.title || 'Freelancer'}</p>
                    </div>
                  </div>

                  {freelancer.verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (freelancer.averageRating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          } ${star <= (freelancer.averageRating || 0) ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {freelancer.averageRating ? `${freelancer.averageRating.toFixed(1)} (${freelancer.totalReviews || 0} reviews)` : 'No ratings yet'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">Hourly Rate:</span> ${freelancer.hourlyRate}/hr
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {freelancer.bio || 'No bio available'}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to={`/client/freelancers/${freelancer._id}`}
                    className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Freelancers;
