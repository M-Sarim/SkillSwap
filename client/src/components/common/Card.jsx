import React from 'react';

/**
 * A reusable card component with consistent styling
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Whether to add hover effects
 * @param {boolean} props.noPadding - Whether to remove padding
 * @param {boolean} props.bordered - Whether to add a border
 * @param {string} props.as - HTML element to render as
 */
const Card = ({
  children,
  className = '',
  hover = true,
  noPadding = false,
  bordered = true,
  as: Component = 'div'
}) => {
  return (
    <Component
      className={`
        bg-white rounded-2xl shadow-soft
        ${bordered ? 'border border-neutral-100' : ''}
        ${hover ? 'transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1' : ''}
        ${noPadding ? '' : 'p-6 sm:p-7'}
        ${className}
      `}
    >
      {children}
    </Component>
  );
};

export default Card;
