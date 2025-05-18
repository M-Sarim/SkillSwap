import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  StarIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import useApi from "../../hooks/useApi";
import { formatDate } from "../../utils/helpers";
import ReviewsList from "../../components/common/ReviewsList";

const FreelancerProfile = () => {
  const { id } = useParams();
  const { get, loading } = useApi();
  const [freelancer, setFreelancer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewFilters, setReviewFilters] = useState({
    rating: "all",
    sort: "newest",
    page: 1,
  });

  useEffect(() => {
    const fetchFreelancerData = async () => {
      try {
        // Fetch freelancer profile
        const profileResponse = await get(`/freelancers/${id}`);
        if (profileResponse.success) {
          setFreelancer(profileResponse.data.freelancer);
        }

        // Fetch reviews with stats
        const reviewsResponse = await get(
          `/projects/freelancers/${id}/reviews`,
          {
            params: {
              ...reviewFilters,
              limit: 10,
            },
          }
        );

        if (reviewsResponse.success) {
          setReviews(reviewsResponse.data.reviews);
          setReviewStats(reviewsResponse.data.stats);
        }

        // Fetch completed projects
        const projectsResponse = await get(`/freelancers/${id}/projects`);
        if (projectsResponse.success) {
          setCompletedProjects(
            projectsResponse.data.projects.filter(
              (project) => project.status === "Completed"
            )
          );
        }
      } catch (error) {
        console.error("Error fetching freelancer data:", error);
      }
    };

    fetchFreelancerData();
  }, [get, id, reviewFilters]);

  const handleReviewFilterChange = (filters) => {
    setReviewFilters((prev) => ({
      ...prev,
      ...filters,
      page: filters.page || 1,
    }));
  };

  if (loading || !freelancer) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          to="/client/freelancers"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to Freelancers
        </Link>
      </div>

      {/* Freelancer Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-4">
                {freelancer.user?.profileImage ? (
                  <img
                    src={freelancer.user.profileImage}
                    alt={freelancer.user.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  freelancer.user?.name?.charAt(0) || "F"
                )}
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900 mr-2">
                    {freelancer.user?.name || "Freelancer"}
                  </h1>
                  {freelancer.verified && (
                    <CheckBadgeIcon className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <p className="text-gray-500">
                  {freelancer.title || "Freelancer"}
                </p>
                {reviewStats && (
                  <div className="flex items-center mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-5 w-5 ${
                            star <= reviewStats.average
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {reviewStats.average.toFixed(1)} ({reviewStats.total}{" "}
                      reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:items-end">
              <p className="text-2xl font-bold text-gray-900">
                ${freelancer.hourlyRate}/hr
              </p>
              <p className="text-sm text-gray-500 mb-4">Hourly Rate</p>
              <Link
                to={`/client/messages/${freelancer.user?._id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                Contact Freelancer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "reviews"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "portfolio"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Portfolio
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  About
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {freelancer.bio || "No bio available."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Skills
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Experience
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">
                        {freelancer.experience || 0} years of experience
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">
                        Member since {formatDate(freelancer.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">
                        {completedProjects.length} projects completed
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Education
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      {freelancer.education ||
                        "No education information available."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Completed Projects */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Completed Projects
                </h2>
                {completedProjects.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="divide-y divide-gray-200">
                      {completedProjects.map((project) => (
                        <li
                          key={project._id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {project.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {project.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(project.completedAt)}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                ${project.budget}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500">No completed projects yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div>
              <ReviewsList
                reviews={reviews}
                showFilters={true}
                onFilterChange={handleReviewFilterChange}
                stats={reviewStats}
              />
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === "portfolio" && (
            <div>
              {freelancer.portfolio && freelancer.portfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {freelancer.portfolio.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg overflow-hidden"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {item.description}
                        </p>
                        {item.technologies && (
                          <div className="flex flex-wrap gap-2">
                            {item.technologies.map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                          >
                            View Project
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No portfolio items available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfile;
