import React from 'react';
import { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatDate, calculateTimeRemaining } from '../../utils/helpers';

/**
 * ProjectTimeline component for displaying project progress, deadlines, and time tracking
 */
const ProjectTimeline = ({
  project,
  onUpdateProgress,
  isHourlyProject = false,
  timeTracking = null,
  onStartTimeTracking = () => {},
  onStopTimeTracking = () => {},
  isClient = false // Add isClient prop to determine if the user is a client
}) => {
  // State
  const [progress, setProgress] = useState(project?.progress || 0);
  const [isTracking, setIsTracking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    calculateTimeRemaining(project?.deadline)
  );
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Update progress when project changes
  useEffect(() => {
    if (project?.progress !== undefined) {
      setProgress(project.progress);
    } else if (project?.milestones && project.milestones.length > 0) {
      // Calculate progress based on milestones if direct progress is not available
      const completedMilestones = project.milestones.filter(
        milestone => ["Completed", "Approved"].includes(milestone.status)
      ).length;
      const calculatedProgress = Math.round((completedMilestones / project.milestones.length) * 100);
      setProgress(calculatedProgress);
    }
  }, [project?.progress, project?.milestones]);

  // Update time remaining every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(project?.deadline));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [project?.deadline]);

  // Handle manual progress update
  const handleProgressChange = (e) => {
    try {
      const newProgress = parseInt(e.target.value, 10);

      // Validate the progress value
      if (isNaN(newProgress)) {
        console.error("Invalid progress value");
        return;
      }

      // Update local state
      setProgress(newProgress);

      // Clear any existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set a new timer
      const timer = setTimeout(() => {
        if (onUpdateProgress) {
          try {
            onUpdateProgress(newProgress);
          } catch (error) {
            console.error("Error in onUpdateProgress callback:", error);
          }
        }
      }, 500);

      setDebounceTimer(timer);
    } catch (error) {
      console.error("Error in handleProgressChange:", error);
    }
  };

  // Handle time tracking
  const toggleTimeTracking = () => {
    if (isTracking) {
      onStopTimeTracking();
      setIsTracking(false);
    } else {
      onStartTimeTracking();
      setIsTracking(true);
    }
  };

  // Format time tracking duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  };

  // Get deadline status class
  const getDeadlineStatusClass = () => {
    if (!project?.deadline) return 'text-gray-500';

    if (timeRemaining.isExpired) {
      return 'text-red-600';
    }

    if (timeRemaining.days < 3) {
      return 'text-yellow-600';
    }

    return 'text-green-600';
  };

  // Ensure we have a valid progress value
  const displayProgress = isNaN(progress) ? 0 : progress;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Project Timeline</h3>
      </div>

      <div className="px-4 py-5 sm:p-6">
        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Project Progress</h4>
            <span className="text-sm font-medium text-gray-700">{displayProgress}% completed</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-primary-600 h-2.5 rounded-full"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>

          {/* Manual Progress Update - Only show for freelancers */}
          {!isClient && (
            <div className="flex items-center mt-2">
              <input
                type="range"
                min="0"
                max="100"
                value={displayProgress}
                onChange={handleProgressChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Deadline Section */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CalendarIcon className={`h-5 w-5 ${getDeadlineStatusClass()}`} />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">Project Deadline</h4>
              <p className="text-sm text-gray-500 mt-1">
                {project?.deadline ? formatDate(project.deadline) : 'No deadline set'}
              </p>

              {!timeRemaining.isExpired && project?.deadline && (
                <div className="mt-2">
                  <p className={`text-sm font-medium ${getDeadlineStatusClass()}`}>
                    Time remaining:
                    <span className="ml-1">
                      {timeRemaining.days > 0 && `${timeRemaining.days} days, `}
                      {timeRemaining.hours} hours, {timeRemaining.minutes} minutes
                    </span>
                  </p>
                </div>
              )}

              {timeRemaining.isExpired && project?.deadline && (
                <div className="mt-2 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 text-red-600 mr-1" />
                  <p className="text-sm font-medium text-red-600">
                    Deadline has passed
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Tracking Section (for hourly projects) */}
        {isHourlyProject && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="ml-3 flex-grow">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900">Time Tracking</h4>
                  <button
                    onClick={toggleTimeTracking}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                      isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  >
                    {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Total time logged:</span>
                    <span className="ml-1">
                      {timeTracking ? formatDuration(timeTracking.totalSeconds) : '0h 0m'}
                    </span>
                  </p>

                  {isTracking && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                      <span>Currently tracking time...</span>
                    </div>
                  )}

                  {timeTracking?.sessions && timeTracking.sessions.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Recent Sessions</h5>
                      <div className="space-y-2">
                        {timeTracking.sessions.slice(0, 3).map((session, index) => (
                          <div key={index} className="flex justify-between text-xs text-gray-500">
                            <span>{formatDate(session.startTime, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                            <span>{formatDuration(session.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Status Updates */}
        {project?.milestones && project.milestones.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Milestone Status</h4>
            <div className="space-y-3">
              {project.milestones.map((milestone, index) => (
                <div key={index} className="flex items-center">
                  <div className="relative flex items-center justify-center">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                      milestone.status === 'Completed' || milestone.status === 'Approved'
                        ? 'bg-green-100'
                        : milestone.status === 'In Progress'
                          ? 'bg-yellow-100'
                          : 'bg-gray-100'
                    }`}>
                      {milestone.status === 'Completed' || milestone.status === 'Approved' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : milestone.status === 'In Progress' ? (
                        <ArrowPathIcon className="h-3 w-3 text-yellow-600" />
                      ) : (
                        <span className="h-2 w-2 bg-gray-400 rounded-full"></span>
                      )}
                    </div>
                    {index < project.milestones.length - 1 && (
                      <div className="absolute top-5 h-full w-0.5 bg-gray-200"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-grow">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{milestone.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        milestone.status === 'Completed' || milestone.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : milestone.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {milestone.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Due: {formatDate(milestone.dueDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTimeline;
