import React from 'react';
import Button from './Button';

/**
 * A reusable empty state component with consistent styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Title text
 * @param {string} props.message - Message text
 * @param {string} props.actionText - Text for the action button
 * @param {string} props.actionLink - Link for the action button
 * @param {function} props.actionOnClick - Click handler for the action button
 * @param {React.ReactNode} props.icon - Optional icon component
 */
const EmptyState = ({ 
  title, 
  message, 
  actionText, 
  actionLink, 
  actionOnClick,
  icon
}) => {
  return (
    <div className="text-center py-10 px-6 bg-white rounded-xl shadow-md">
      {icon && (
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-secondary-50 mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
      
      {(actionText && (actionLink || actionOnClick)) && (
        <Button 
          variant="primary"
          to={actionLink}
          onClick={actionOnClick}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
