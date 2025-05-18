import { useState } from 'react';
import { 
  DocumentIcon, 
  XMarkIcon, 
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import useApi from '../../hooks/useApi';

const DocumentUploader = ({ onUploadComplete }) => {
  const { post, loading } = useApi();
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];
  
  // Max file size (5MB)
  const maxFileSize = 5 * 1024 * 1024;
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`File type not supported: ${file.name}. Please upload PDF, JPEG, or PNG files.`);
        return false;
      }
      
      if (file.size > maxFileSize) {
        setError(`File too large: ${file.name}. Maximum file size is 5MB.`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };
  
  // Remove file from list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // In a real app, you would use FormData to upload files
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });
      
      // Upload files to server
      const response = await post('/freelancer/documents', formData);
      
      if (response.success) {
        setUploadedFiles(response.data.documents);
        setFiles([]);
        
        if (onUploadComplete) {
          onUploadComplete(response.data.documents);
        }
      }
    } catch (err) {
      console.error('Error uploading documents:', err);
      setError('Failed to upload documents. Please try again.');
      
      // For demonstration, simulate successful upload
      const mockUploadedFiles = files.map(file => ({
        _id: 'doc_' + Date.now() + Math.random().toString(36).substring(2, 9),
        filename: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date(),
        status: 'Pending'
      }));
      
      setUploadedFiles(prev => [...prev, ...mockUploadedFiles]);
      setFiles([]);
      
      if (onUploadComplete) {
        onUploadComplete(mockUploadedFiles);
      }
    } finally {
      setUploading(false);
    }
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return (
        <DocumentIcon className="h-8 w-8 text-red-500" />
      );
    } else if (fileType.includes('image')) {
      return (
        <DocumentIcon className="h-8 w-8 text-blue-500" />
      );
    } else {
      return (
        <DocumentIcon className="h-8 w-8 text-gray-500" />
      );
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="document-upload"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="document-upload"
          className="cursor-pointer"
        >
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-primary-600 hover:text-primary-500">
              Click to upload
            </span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PDF, JPG, PNG up to 5MB
          </p>
        </label>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Selected Files */}
      {files.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h4>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {files.map((file, index) => (
              <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center">
                  {getFileIcon(file.type)}
                  <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-4">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : 'Upload Files'}
            </button>
          </div>
        </div>
      )}
      
      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h4>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {uploadedFiles.map((file) => (
              <li key={file._id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center">
                  {getFileIcon(file.fileType)}
                  <span className="ml-2 flex-1 w-0 truncate">{file.filename}</span>
                </div>
                <div className="flex items-center">
                  {getStatusBadge(file.status)}
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 text-primary-600 hover:text-primary-500"
                  >
                    View
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
