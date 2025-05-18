import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { 
  PlusIcon, 
  XMarkIcon,
  DocumentPlusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import AuthContext from '../../context/AuthContext';
import useApi from '../../hooks/useApi';

const categories = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Graphic Design',
  'Content Writing',
  'Digital Marketing',
  'Video Editing',
  'Data Entry',
  'Virtual Assistant',
  'Translation',
  'Other'
];

const PostProject = () => {
  const { user } = useContext(AuthContext);
  const { post, loading, error } = useApi();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);

  // Validation schema
  const validationSchema = Yup.object({
    title: Yup.string()
      .required('Title is required')
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title cannot exceed 100 characters'),
    description: Yup.string()
      .required('Description is required')
      .min(20, 'Description must be at least 20 characters'),
    category: Yup.string()
      .required('Category is required'),
    skills: Yup.array()
      .of(Yup.string())
      .min(1, 'At least one skill is required'),
    budget: Yup.number()
      .required('Budget is required')
      .positive('Budget must be positive'),
    deadline: Yup.date()
      .required('Deadline is required')
      .min(new Date(), 'Deadline must be in the future'),
    paymentType: Yup.string()
      .required('Payment type is required')
      .oneOf(['Fixed', 'Hourly'], 'Invalid payment type')
  });

  // Initial values
  const initialValues = {
    title: '',
    description: '',
    category: '',
    skills: [''],
    budget: '',
    deadline: '',
    paymentType: 'Fixed',
    attachments: []
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  // Remove file
  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // In a real app, you would upload files to a server and get URLs
      // For now, we'll just use file names
      const attachments = files.map(file => ({
        filename: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        fileType: file.type
      }));

      const projectData = {
        ...values,
        attachments
      };

      const response = await post('/projects', projectData);

      if (response.success) {
        navigate(`/client/projects/${response.data.project._id}`);
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Project</h1>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Project Title
                </label>
                <Field
                  type="text"
                  name="title"
                  id="title"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="e.g., Website Development for E-commerce Store"
                />
                <ErrorMessage name="title" component="p" className="mt-2 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Project Description
                </label>
                <Field
                  as="textarea"
                  name="description"
                  id="description"
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Describe your project in detail. Include requirements, expectations, and any specific details freelancers should know."
                />
                <ErrorMessage name="description" component="p" className="mt-2 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <Field
                  as="select"
                  name="category"
                  id="category"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Field>
                <ErrorMessage name="category" component="p" className="mt-2 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Skills Required
                </label>
                <FieldArray name="skills">
                  {({ remove, push }) => (
                    <div className="space-y-2">
                      {values.skills.map((skill, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Field
                            name={`skills.${index}`}
                            type="text"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="e.g., React, JavaScript, UI Design"
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => push('')}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Skill
                      </button>
                    </div>
                  )}
                </FieldArray>
                {errors.skills && touched.skills && (
                  <p className="mt-2 text-sm text-red-600">{errors.skills}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                    Budget (USD)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <Field
                      type="number"
                      name="budget"
                      id="budget"
                      className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                  <ErrorMessage name="budget" component="p" className="mt-2 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                    Deadline
                  </label>
                  <Field
                    type="date"
                    name="deadline"
                    id="deadline"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <ErrorMessage name="deadline" component="p" className="mt-2 text-sm text-red-600" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Type
                </label>
                <div className="mt-2 space-x-4">
                  <label className="inline-flex items-center">
                    <Field
                      type="radio"
                      name="paymentType"
                      value="Fixed"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Fixed Price</span>
                  </label>
                  <label className="inline-flex items-center">
                    <Field
                      type="radio"
                      name="paymentType"
                      value="Hourly"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hourly Rate</span>
                  </label>
                </div>
                <ErrorMessage name="paymentType" component="p" className="mt-2 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attachments (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </div>
                </div>
                {files.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                    <ul className="mt-2 divide-y divide-gray-200">
                      {files.map((file, index) => (
                        <li key={index} className="py-2 flex justify-between items-center">
                          <div className="flex items-center">
                            <DocumentPlusIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{file.name}</span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(2)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Tips for getting great proposals</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Be specific about your requirements</li>
                        <li>Provide examples of what you're looking for</li>
                        <li>Set a realistic budget and timeline</li>
                        <li>Respond quickly to questions from freelancers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/client')}
                  className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </>
                  ) : 'Post Project'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default PostProject;
