import { useState } from 'react';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const ContractViewer = ({ 
  contract, 
  onSign, 
  onTerminate, 
  isClient, 
  isFreelancer 
}) => {
  const [activeTab, setActiveTab] = useState('details');
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="badge badge-success">Active</span>;
      case 'Pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'Completed':
        return <span className="badge badge-success">Completed</span>;
      case 'Terminated':
        return <span className="badge badge-danger">Terminated</span>;
      case 'Disputed':
        return <span className="badge badge-danger">Disputed</span>;
      default:
        return <span className="badge badge-info">Draft</span>;
    }
  };
  
  const canSign = () => {
    if (isClient && !contract.clientSignature.signed) {
      return true;
    }
    
    if (isFreelancer && !contract.freelancerSignature.signed) {
      return true;
    }
    
    return false;
  };
  
  const canTerminate = () => {
    return isClient && 
      contract.status === 'Active' && 
      contract.clientSignature.signed && 
      contract.freelancerSignature.signed;
  };

  return (
    <div className="card">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Contract Details
          </button>
          <button
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'deliverables'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('deliverables')}
          >
            Deliverables
          </button>
          <button
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'versions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('versions')}
          >
            Versions
          </button>
        </nav>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {contract.title}
          </h3>
          {getStatusBadge(contract.status)}
        </div>
        
        {activeTab === 'details' && (
          <div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Contract Amount</p>
                <p className="font-medium">{formatCurrency(contract.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Terms</p>
                <p className="font-medium">{contract.paymentTerms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                <p className="font-medium">{formatDate(contract.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">End Date</p>
                <p className="font-medium">{formatDate(contract.endDate)}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600">{contract.description}</p>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Terms & Conditions</h4>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-gray-600 text-sm whitespace-pre-line">
                {contract.terms}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Client Signature</h4>
                {contract.clientSignature.signed ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    <span>Signed on {formatDate(contract.clientSignature.date)}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <ClockIcon className="h-5 w-5 mr-1" />
                    <span>Not signed yet</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Freelancer Signature</h4>
                {contract.freelancerSignature.signed ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    <span>Signed on {formatDate(contract.freelancerSignature.date)}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <ClockIcon className="h-5 w-5 mr-1" />
                    <span>Not signed yet</span>
                  </div>
                )}
              </div>
            </div>
            
            {contract.terminationReason && (
              <div className="mb-6 p-4 bg-red-50 rounded-md border border-red-100">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Termination Reason</h4>
                <p className="text-gray-600 text-sm">{contract.terminationReason}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Terminated on {formatDate(contract.terminationDate)}
                </p>
              </div>
            )}
            
            {contract.disputeDetails && contract.disputeDetails.reason && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-md border border-yellow-100">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Dispute Details</h4>
                <p className="text-gray-600 text-sm mb-1">
                  <span className="font-medium">Reason: </span>
                  {contract.disputeDetails.reason}
                </p>
                <p className="text-gray-600 text-sm">{contract.disputeDetails.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Filed by {contract.disputeDetails.filedBy} on {formatDate(contract.disputeDetails.filedDate)}
                </p>
                {contract.disputeDetails.resolution && (
                  <div className="mt-2 pt-2 border-t border-yellow-200">
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Resolution: </span>
                      {contract.disputeDetails.resolution}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Resolved on {formatDate(contract.disputeDetails.resolutionDate)}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {contract.attachments && contract.attachments.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                <div className="space-y-2">
                  {contract.attachments.map((attachment, i) => (
                    <a 
                      key={i}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded on {formatDate(attachment.uploadDate)}
                        </p>
                      </div>
                      <ArrowDownTrayIcon className="h-5 w-5 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                  Download PDF
                </button>
              </div>
              
              <div className="flex space-x-2">
                {canSign() && (
                  <button
                    onClick={onSign}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Sign Contract
                  </button>
                )}
                
                {canTerminate() && (
                  <button
                    onClick={onTerminate}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Terminate Contract
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'deliverables' && (
          <div>
            <div className="space-y-4">
              {contract.deliverables.map((deliverable, index) => (
                <div 
                  key={index} 
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {index + 1}. {deliverable.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {deliverable.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Due: {formatDate(deliverable.dueDate)}
                  </p>
                </div>
              ))}
            </div>
            
            {contract.deliverables.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No deliverables specified</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'versions' && (
          <div>
            <div className="space-y-4">
              {contract.versions.map((version, index) => (
                <div 
                  key={index} 
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">
                      Version {version.versionNumber}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(version.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {version.changes}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                    <span className="font-medium">Hash: </span>
                    <code className="bg-gray-100 px-1 py-0.5 rounded">{version.hash.substring(0, 16)}...</code>
                  </div>
                </div>
              ))}
            </div>
            
            {contract.versions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No version history available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractViewer;
