/**
 * Format a date to a readable string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
};

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === undefined || amount === null) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Truncate a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
export const truncateString = (str, length = 100) => {
  if (!str) return '';
  
  if (str.length <= length) return str;
  
  return `${str.substring(0, length)}...`;
};

/**
 * Calculate time remaining until a deadline
 * @param {string|Date} deadline - Deadline date
 * @returns {Object} Time remaining object
 */
export const calculateTimeRemaining = (deadline) => {
  if (!deadline) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  
  const diffInSeconds = Math.floor((deadlineDate - now) / 1000);
  
  if (diffInSeconds <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  const days = Math.floor(diffInSeconds / (60 * 60 * 24));
  const hours = Math.floor((diffInSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((diffInSeconds % (60 * 60)) / 60);
  const seconds = diffInSeconds % 60;
  
  return { days, hours, minutes, seconds, isExpired: false };
};

/**
 * Get status badge color based on status
 * @param {string} status - Status string
 * @returns {string} CSS class for badge
 */
export const getStatusBadgeClass = (status) => {
  if (!status) return 'badge-info';
  
  switch (status.toLowerCase()) {
    case 'open':
      return 'badge-info';
    case 'in progress':
      return 'badge-warning';
    case 'completed':
      return 'badge-success';
    case 'cancelled':
      return 'badge-danger';
    case 'pending':
      return 'badge-info';
    case 'accepted':
      return 'badge-success';
    case 'rejected':
      return 'badge-danger';
    case 'withdrawn':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
};

/**
 * Calculate profile completeness percentage
 * @param {Object} profile - User profile object
 * @param {string} role - User role
 * @returns {number} Completeness percentage
 */
export const calculateProfileCompleteness = (profile, role) => {
  if (!profile) return 0;
  
  let fields = [];
  let completedFields = 0;
  
  if (role === 'freelancer') {
    fields = [
      'bio',
      'skills',
      'hourlyRate',
      'education',
      'experience',
      'portfolio',
      'availability',
      'socialProfiles'
    ];
    
    // Check each field
    if (profile.bio) completedFields++;
    if (profile.skills && profile.skills.length > 0) completedFields++;
    if (profile.hourlyRate) completedFields++;
    if (profile.education && profile.education.length > 0) completedFields++;
    if (profile.experience && profile.experience.length > 0) completedFields++;
    if (profile.portfolio && profile.portfolio.length > 0) completedFields++;
    if (profile.availability) completedFields++;
    if (profile.socialProfiles && Object.values(profile.socialProfiles).some(v => v)) completedFields++;
  } else if (role === 'client') {
    fields = [
      'company',
      'position',
      'website',
      'location',
      'bio'
    ];
    
    // Check each field
    if (profile.company) completedFields++;
    if (profile.position) completedFields++;
    if (profile.website) completedFields++;
    if (profile.location) completedFields++;
    if (profile.bio) completedFields++;
  }
  
  return Math.round((completedFields / fields.length) * 100);
};
