import { useState } from 'react';
import { formatDate, formatCurrency, getStatusBadgeClass } from '../../utils/helpers';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const MilestoneTracker = ({ 
  milestones, 
  onMarkComplete, 
  onApprove, 
  onReject, 
  isClient, 
  isFreelancer 
}) => {
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  
  const toggleExpand = (id) => {
    if (expandedMilestone === id) {
      setExpandedMilestone(null);
    } else {
      setExpandedMilestone(id);
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'In Progress':
        return <ArrowPathIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getProgressPercentage = () => {
    if (!milestones || milestones.length === 0) return 0;
    
    const completedCount = milestones.filter(
      m => m.status === 'Completed' || m.status === 'Approved'
    ).length;
    
    return Math.round((completedCount / milestones.length) * 100);
  };
  
  const progressPercentage = getProgressPercentage();

  return (
    <div className="card">
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h3>
        
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const statusClass = getStatusBadgeClass(milestone.status);
            const isExpanded = expandedMilestone === milestone._id;
            
            return (
              <div 
                key={milestone._id} 
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(milestone._id)}
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      {getStatusIcon(milestone.status)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {index + 1}. {milestone.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Due: {formatDate(milestone.dueDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`badge ${statusClass} mr-3`}>
                      {milestone.status}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(milestone.amount)}
                    </span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-4">
                      {milestone.description}
                    </p>
                    
                    {milestone.completionDate && (
                      <p className="text-xs text-gray-500 mb-2">
                        <span className="font-medium">Completed on: </span>
                        {formatDate(milestone.completionDate)}
                      </p>
                    )}
                    
                    {milestone.feedback && (
                      <div className="mb-4 p-3 bg-gray-100 rounded-md">
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Feedback</h5>
                        <p className="text-sm text-gray-600">{milestone.feedback}</p>
                      </div>
                    )}
                    
                    {milestone.attachments && milestone.attachments.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Attachments</h5>
                        <div className="space-y-1">
                          {milestone.attachments.map((attachment, i) => (
                            <a 
                              key={i}
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                            >
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                              </svg>
                              {attachment.filename}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      {isFreelancer && milestone.status === 'Pending' && (
                        <button
                          onClick={() => onMarkComplete(milestone._id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Mark as Completed
                        </button>
                      )}
                      
                      {isClient && milestone.status === 'Completed' && (
                        <>
                          <button
                            onClick={() => onApprove(milestone._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(milestone._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MilestoneTracker;
