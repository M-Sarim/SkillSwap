import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A reusable button component with consistent styling
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Button variant (primary, secondary, outline, text, gradient)
 * @param {string} props.size - Button size (xs, sm, md, lg, xl)
 * @param {string} props.to - Link destination (if button should be a Link)
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.rounded - Whether to use fully rounded corners
 * @param {string} props.icon - Icon to display before text
 * @param {string} props.iconAfter - Icon to display after text
 */
const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  to,
  fullWidth = false,
  disabled = false,
  onClick,
  rounded = false,
  icon: Icon,
  iconAfter: IconAfter,
  ...rest
}) => {
  // Define base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none';

  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-base'
  };

  // Border radius classes
  const radiusClasses = rounded ? 'rounded-full' : 'rounded-2xl';

  // Variant classes
  const variantClasses = {
    primary: 'text-white bg-secondary-600 hover:bg-secondary-700 focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 shadow-md hover:shadow-lg',
    secondary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg',
    outline: 'text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500',
    text: 'text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 bg-transparent',
    gradient: 'text-white bg-gradient-to-r from-secondary-600 to-primary-600 hover:from-secondary-700 hover:to-primary-700 shadow-md hover:shadow-lg'
  };

  // Combine classes
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${radiusClasses}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  const content = (
    <>
      {Icon && <Icon className={`h-5 w-5 ${children ? 'mr-2' : ''}`} aria-hidden="true" />}
      {children}
      {IconAfter && <IconAfter className={`h-5 w-5 ${children ? 'ml-2' : ''}`} aria-hidden="true" />}
    </>
  );

  // If to prop is provided, render a Link
  if (to) {
    return (
      <Link to={to} className={buttonClasses} {...rest}>
        {content}
      </Link>
    );
  }

  // Otherwise render a button
  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  );
};

export default Button;
