import { Link } from "react-router-dom";
import {
  formatDate,
  formatCurrency,
  truncateString,
  getStatusBadgeClass,
  calculateTimeRemaining,
} from "../../utils/helpers";
import Card from "./Card";
import {
  ArrowRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const ProjectCard = ({ project, linkTo }) => {
  // Handle null project or missing properties
  if (!project) {
    return (
      <Card className="h-full flex flex-col">
        <div className="p-6 flex-grow">
          <h3 className="text-lg font-semibold text-neutral-900">
            Project data unavailable
          </h3>
          <p className="text-neutral-600 mt-2">
            This project information could not be loaded.
          </p>
        </div>
      </Card>
    );
  }

  const timeRemaining = project.deadline
    ? calculateTimeRemaining(project.deadline)
    : { days: 0, hours: 0, minutes: 0, isExpired: true };

  // Define status badge classes
  const getStatusBadge = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20";
      case "In Progress":
        return "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20";
      case "Completed":
        return "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20";
      case "Cancelled":
        return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20";
      default:
        return "bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-600/20";
    }
  };

  return (
    <Card className="h-full flex flex-col group" noPadding>
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-neutral-900">
            <Link
              to={linkTo}
              className="hover:text-secondary-600 transition-colors duration-200"
            >
              {project.title || "Untitled Project"}
            </Link>
          </h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
              project.status || "Unknown"
            )}`}
          >
            {project.status || "Unknown"}
          </span>
        </div>

        <p className="text-neutral-600 mb-5 text-sm leading-relaxed">
          {project.description
            ? truncateString(project.description, 150)
            : "No description available"}
        </p>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary-50 text-secondary-600 mr-3">
              <CurrencyDollarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">Budget</p>
              <p className="font-medium text-sm">
                {project.budget
                  ? formatCurrency(project.budget)
                  : "Not specified"}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-600 mr-3">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">Deadline</p>
              <p className="font-medium text-sm">
                {project.deadline
                  ? formatDate(project.deadline)
                  : "Not specified"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.skills && project.skills.length > 0 ? (
            project.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-secondary-50 text-secondary-700 text-xs font-medium px-2.5 py-1 rounded-full border border-secondary-100"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-neutral-500 text-xs">
              No skills specified
            </span>
          )}
        </div>

        {!timeRemaining.isExpired && project.status === "Open" && (
          <div className="mt-4 text-xs text-neutral-600 flex items-center">
            <ClockIcon className="w-4 h-4 mr-1.5 text-secondary-500" />
            <span className="font-medium">Time remaining: </span>
            <span className="ml-1">
              {timeRemaining.days > 0 && `${timeRemaining.days} days, `}
              {timeRemaining.hours} hours, {timeRemaining.minutes} minutes
            </span>
          </div>
        )}

        <div className="flex justify-between items-center mt-5 pt-5 border-t border-neutral-100">
          <div className="text-xs text-neutral-500">
            <span className="font-medium">Posted: </span>
            {project.createdAt ? formatDate(project.createdAt) : "Unknown date"}
          </div>

          <div className="text-xs text-neutral-500 flex items-center">
            <UserGroupIcon className="w-3.5 h-3.5 mr-1" />
            <span className="font-medium">Bids: </span>
            <span className="ml-1">{project.bids?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-neutral-50 to-white px-6 py-4 border-t border-neutral-100 rounded-b-2xl">
        <Link
          to={linkTo}
          className="text-secondary-600 hover:text-secondary-700 transition-colors duration-200 font-medium text-sm flex items-center group-hover:underline"
        >
          View Details
          <ArrowRightIcon className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>
    </Card>
  );
};

export default ProjectCard;
