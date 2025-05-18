import { useState } from 'react';
import { 
  CalendarIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import AnalyticsDashboard from '../../components/freelancer/AnalyticsDashboard';

const Analytics = () => {
  const [dateRange, setDateRange] = useState('last30days');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        
        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last3months">Last 3 Months</option>
              <option value="last6months">Last 6 Months</option>
              <option value="lastyear">Last Year</option>
              <option value="alltime">All Time</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-400" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
    </div>
  );
};

export default Analytics;
