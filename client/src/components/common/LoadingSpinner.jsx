import React from 'react';

/**
 * A reusable loading spinner component with consistent styling
 *
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (xs, sm, md, lg, xl)
 * @param {string} props.color - Color of the spinner (primary, secondary, neutral, gradient)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.label - Optional loading text
 * @param {boolean} props.center - Whether to center the spinner
 */
const LoadingSpinner = ({
  size = 'md',
  color = 'secondary',
  className = '',
  label,
  center = true
}) => {
  // Size classes
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  // Color classes
  const colorClasses = {
    primary: 'border-t-primary-500 border-r-primary-300 border-b-primary-200 border-l-primary-300',
    secondary: 'border-t-secondary-500 border-r-secondary-300 border-b-secondary-200 border-l-secondary-300',
    neutral: 'border-t-neutral-500 border-r-neutral-300 border-b-neutral-200 border-l-neutral-300',
    gradient: 'border-t-secondary-500 border-r-primary-400 border-b-primary-500 border-l-secondary-400'
  };

  const spinner = (
    <div className={`${center ? 'flex flex-col items-center justify-center' : ''} ${className}`}>
      <div
        className={`
          animate-spin rounded-full
          border-2
          ${sizeClasses[size]}
          ${colorClasses[color]}
        `}
      ></div>
      {label && (
        <p className="mt-3 text-sm text-neutral-600 font-medium">{label}</p>
      )}
    </div>
  );

  if (center) {
    return (
      <div className="flex justify-center py-6">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
