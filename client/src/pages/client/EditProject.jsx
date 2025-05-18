import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  XMarkIcon, 
  DocumentIcon 
} from '@heroicons/react/24/outline';
import useApi from '../../hooks/useApi';
import { toast } from 'react-toastify';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, put, loading } = useApi();
  const [files, setFiles] = useState([]);
  const [initialValues, setInitialValues] = useState({
    title: '',
    description: '',
    category: '',
    skills: [''],
    budget: '',
    deadline: '',
    paymentType: 'Fixed',
    status: 'Open',
    attachments: []
  });
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await get(`/projects/${id}`);
        if (response.success) {
          const project = response.data.project;
          
          // Format date for input field (YYYY-MM-DD)
          const formattedDeadline = project.deadline 
            ? new Date(project.deadline).toISOString().split('T')[0]
            : '';
          
          setInitialValues({
            title: project.title || '',
            description: project.description || '',
            category: project.category || '',
            skills: project.skills?.length ? project.skills : [''],
            budget: project.budget || '',
            deadline: formattedDeadline,
            paymentType: project.paymentType || 'Fixed',
            status: project.status || 'Open'
          });
          
          setExistingAttachments(project.attachments || []);
        } else {
          toast.error('Failed to load project data');
          navigate('/client/projects');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        toast.error('Error loading project data');
        navigate('/client/projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, get, navigate]);

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
      .oneOf(['Fixed', 'Hourly'], 'Invalid payment type'),
    status: Yup.string()
      .required('Status is required')
      .oneOf(['Open', 'In Progress', 'Completed', 'Cancelled'], 'Invalid status')
  });

  // Handle file upload
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  // Remove file
  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Remove existing attachment
  const removeAttachment = (index) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Process new file uploads
      const newAttachments = files.map(file => ({
        filename: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        fileType: file.type
      }));

      // Combine existing and new attachments
      const attachments = [...existingAttachments, ...newAttachments];

      const projectData = {
        ...values,
        attachments
      };

      const response = await put(`/projects/${id}`, projectData);

      if (response.success) {
        toast.success('Project updated successfully');
        navigate(`/client/projects/${id}`);
      } else {
        toast.error(response.message || 'Failed to update project');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Error updating project');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => navigate(`/client/projects/${id}`)}
          className="mr-4 text-gray-400 hover:text-gray-500"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
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
                  placeholder="Describe your project requirements, goals, and expectations..."
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
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Content Writing">Content Writing</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="SEO">SEO</option>
                  <option value="Data Entry">Data Entry</option>
                  <option value="Virtual Assistant">Virtual Assistant</option>
                  <option value="Other">Other</option>
                </Field>
                <ErrorMessage name="category" component="p" className="mt-2 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                  Required Skills
                </label>
                <FieldArray name="skills">
                  {({ remove, push }) => (
                    <div className="space-y-2">
                      {values.skills.map((skill, index) => (
                        <div key={index} className="flex items-center">
                          <Field
                            name={`skills.${index}`}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="e.g., React, Node.js, UI Design"
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => push('')}
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
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
                    Budget ($)
                  </label>
                  <Field
                    type="number"
                    name="budget"
                    id="budget"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="e.g., 500"
                  />
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
                  />
                  <ErrorMessage name="deadline" component="p" className="mt-2 text-sm text-red-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700">
                    Payment Type
                  </label>
                  <Field
                    as="select"
                    name="paymentType"
                    id="paymentType"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="Fixed">Fixed Price</option>
                    <option value="Hourly">Hourly Rate</option>
                  </Field>
                  <ErrorMessage name="paymentType" component="p" className="mt-2 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <Field
                    as="select"
                    name="status"
                    id="status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </Field>
                  <ErrorMessage name="status" component="p" className="mt-2 text-sm text-red-600" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attachments
                </label>
                
                {/* Existing attachments */}
                {existingAttachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-500">Existing files:</p>
                    {existingAttachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                        <div className="flex items-center">
                          <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{file.filename}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* New file uploads */}
                <div className="mt-2">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                    Add Files
                  </label>
                </div>
                
                {/* Display selected files */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-500">New files to upload:</p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                        <div className="flex items-center">
                          <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/client/projects/${id}`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EditProject;
