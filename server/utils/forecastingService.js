/**
 * Forecasting Service
 * This service provides simple forecasting functionality for analytics
 * In a real application, this would use more sophisticated machine learning models
 */

/**
 * Simple linear regression implementation
 * @param {Array} x - Array of x values (independent variable)
 * @param {Array} y - Array of y values (dependent variable)
 * @returns {Object} - Regression coefficients (slope and intercept)
 */
const linearRegression = (x, y) => {
  const n = x.length;
  
  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate coefficients
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += (x[i] - meanX) ** 2;
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;
  
  return { slope, intercept };
};

/**
 * Calculate R-squared (coefficient of determination)
 * @param {Array} x - Array of x values
 * @param {Array} y - Array of y values
 * @param {Object} coeffs - Regression coefficients
 * @returns {number} - R-squared value
 */
const calculateRSquared = (x, y, coeffs) => {
  const { slope, intercept } = coeffs;
  const n = x.length;
  
  // Calculate mean of y
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate total sum of squares
  let totalSS = 0;
  for (let i = 0; i < n; i++) {
    totalSS += (y[i] - meanY) ** 2;
  }
  
  // Calculate residual sum of squares
  let residualSS = 0;
  for (let i = 0; i < n; i++) {
    const prediction = slope * x[i] + intercept;
    residualSS += (y[i] - prediction) ** 2;
  }
  
  // Calculate R-squared
  return 1 - (residualSS / totalSS);
};

/**
 * Forecast future values using linear regression
 * @param {Array} data - Array of data points [{ x, y }]
 * @param {number} periods - Number of periods to forecast
 * @returns {Object} - Forecast results
 */
const linearForecast = (data, periods = 3) => {
  // Extract x and y values
  const x = data.map((point, index) => index);
  const y = data.map(point => point.y || point.value || 0);
  
  // Perform linear regression
  const coeffs = linearRegression(x, y);
  const rSquared = calculateRSquared(x, y, coeffs);
  
  // Generate forecast
  const forecast = [];
  for (let i = 1; i <= periods; i++) {
    const nextX = x.length + i - 1;
    const nextY = coeffs.slope * nextX + coeffs.intercept;
    forecast.push({
      x: nextX,
      y: Math.max(0, Math.round(nextY)), // Ensure non-negative values
      label: `Forecast ${i}`
    });
  }
  
  // Generate fitted values for existing data
  const fitted = x.map(xi => ({
    x: xi,
    y: Math.max(0, Math.round(coeffs.slope * xi + coeffs.intercept)),
    label: 'Fitted'
  }));
  
  return {
    forecast,
    fitted,
    coeffs,
    rSquared,
    confidence: rSquared > 0.7 ? 'high' : rSquared > 0.4 ? 'medium' : 'low'
  };
};

/**
 * Exponential smoothing forecast
 * @param {Array} data - Array of data points [{ x, y }]
 * @param {number} periods - Number of periods to forecast
 * @param {number} alpha - Smoothing factor (0-1)
 * @returns {Object} - Forecast results
 */
const exponentialSmoothingForecast = (data, periods = 3, alpha = 0.3) => {
  // Extract y values
  const y = data.map(point => point.y || point.value || 0);
  
  // Initialize smoothed values with the first observation
  const smoothed = [y[0]];
  
  // Calculate smoothed values
  for (let i = 1; i < y.length; i++) {
    smoothed.push(alpha * y[i] + (1 - alpha) * smoothed[i - 1]);
  }
  
  // Generate forecast
  const forecast = [];
  let lastSmoothed = smoothed[smoothed.length - 1];
  
  for (let i = 1; i <= periods; i++) {
    forecast.push({
      x: y.length + i - 1,
      y: Math.max(0, Math.round(lastSmoothed)),
      label: `Forecast ${i}`
    });
  }
  
  // Calculate error metrics
  let mse = 0;
  for (let i = 1; i < y.length; i++) {
    mse += (y[i] - smoothed[i - 1]) ** 2;
  }
  mse /= (y.length - 1);
  
  return {
    forecast,
    smoothed: y.map((yi, i) => ({
      x: i,
      y: Math.max(0, Math.round(smoothed[i])),
      label: 'Smoothed'
    })),
    alpha,
    mse,
    confidence: mse < 10 ? 'high' : mse < 50 ? 'medium' : 'low'
  };
};

/**
 * Generate forecast based on time series data
 * @param {Array} data - Array of data points [{ label, value }]
 * @param {Object} options - Forecast options
 * @returns {Object} - Forecast results
 */
const generateForecast = (data, options = {}) => {
  const { periods = 3, method = 'linear', alpha = 0.3 } = options;
  
  // Convert data to format expected by forecasting functions
  const formattedData = data.map((point, index) => ({
    x: index,
    y: point.value || point.y || 0,
    label: point.label
  }));
  
  // Generate forecast based on selected method
  if (method === 'exponential') {
    return exponentialSmoothingForecast(formattedData, periods, alpha);
  } else {
    return linearForecast(formattedData, periods);
  }
};

module.exports = {
  generateForecast,
  linearForecast,
  exponentialSmoothingForecast
};
