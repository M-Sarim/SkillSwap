import React from "react";

/**
 * A reusable section header component with consistent styling
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.action - Optional action button/link
 * @param {string} props.className - Additional CSS classes
 */
const SectionHeader = ({ title, subtitle, action, className = "" }) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 ${className}`}
    >
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="mt-3 sm:mt-0">{action}</div>}
    </div>
  );
};

export default SectionHeader;
