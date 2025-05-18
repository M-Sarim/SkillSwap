import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';
import useApi from '../../hooks/useApi';
import { toast } from 'react-toastify';

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { get, loading, error } = useApi();
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMyProjects = async () => {
    try {
      console.log('Fetching freelancer projects...');
      const response = await get('/projects/freelancer/projects');

      if (response.success) {
        console.log('Fetched projects:', response.data.projects);

        // Check if we have any projects
        if (response.data.projects && response.data.projects.length > 0) {
          setProjects(response.data.projects);
        } else {
          console.log('No projects found, checking for projects with status "In Progress"');

          // Try to fetch all in-progress projects as a fallback
          try {
            console.log('Trying fallback: fetching all in-progress projects');
            const fallbackResponse = await get('/projects', { status: 'In Progress' });
            if (fallbackResponse.success && fallbackResponse.data.projects) {
              console.log('Fallback: found projects:', fallbackResponse.data.projects);
              // Filter projects that should be assigned to this freelancer
              const myProjects = fallbackResponse.data.projects.filter(
                project => project.freelancer && project.freelancer._id === user._id
              );

              console.log('Found projects through fallback:', myProjects.length);
              if (myProjects.length > 0) {
                setProjects(myProjects);
              } else {
                setProjects([]);
              }
            }
          } catch (fallbackError) {
            console.error('Error in fallback project fetch:', fallbackError);
            setProjects([]);
          }
        }
      } else {
        console.error('Failed to fetch projects:', response);
        toast.error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error fetching projects');
    }
  };

  useEffect(() => {
    fetchMyProjects();
  }, [get, refreshKey]);

  // Listen for bid acceptance events
  useEffect(() => {
    if (!socket) return;

    const handleBidAccepted = (data) => {
      // Show notification
      toast.success(data.message, {
        position: "top-right",
        autoClose: 5000
      });

      console.log('Bid accepted, refreshing projects list...', data);

      // Force refresh projects list to show the newly assigned project
      setRefreshKey(prevKey => prevKey + 1);
    };

    socket.on('yourBidAccepted', handleBidAccepted);

    return () => {
      socket.off('yourBidAccepted', handleBidAccepted);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Projects</h1>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">You haven't been assigned to any projects yet.</p>
          <Link to="/freelancer/find-projects" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Find Projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">Budget: ${project.budget}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <Link
                  to={`/freelancer/projects/${project._id}`}
                  className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProjects;
