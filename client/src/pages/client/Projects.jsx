import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ProjectCard from '../../components/common/ProjectCard';
import useApi from '../../hooks/useApi';

const Projects = () => {
  const { get, loading } = useApi();
  const [projects, setProjects] = useState({
    all: [],
    open: [],
    inProgress: [],
    completed: []
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await get('/projects/client/projects');

        if (response.success) {
          const allProjects = response.data.projects;

          setProjects({
            all: allProjects,
            open: allProjects.filter(p => p.status === 'Open'),
            inProgress: allProjects.filter(p => p.status === 'In Progress'),
            completed: allProjects.filter(p => p.status === 'Completed')
          });
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [get]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
        <Link
          to="/client/post-project"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Post New Project
        </Link>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? 'bg-white text-primary-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
              }`
            }
          >
            All ({projects.all.length})
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? 'bg-white text-primary-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
              }`
            }
          >
            Open ({projects.open.length})
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? 'bg-white text-primary-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
              }`
            }
          >
            In Progress ({projects.inProgress.length})
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${
                selected
                  ? 'bg-white text-primary-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
              }`
            }
          >
            Completed ({projects.completed.length})
          </Tab>
        </Tab.List>

        <Tab.Panels>
          {/* All Projects */}
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : projects.all.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-6">Get started by posting your first project</p>
                <Link
                  to="/client/post-project"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Post New Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.all.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    linkTo={`/client/projects/${project._id}`}
                  />
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* Open Projects */}
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : projects.open.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No open projects</h3>
                <p className="text-gray-500 mb-6">Post a new project to get started</p>
                <Link
                  to="/client/post-project"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Post New Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.open.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    linkTo={`/client/projects/${project._id}`}
                  />
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* In Progress Projects */}
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : projects.inProgress.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects in progress</h3>
                <p className="text-gray-500">Projects will appear here once you've hired a freelancer</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.inProgress.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    linkTo={`/client/projects/${project._id}`}
                  />
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* Completed Projects */}
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : projects.completed.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed projects</h3>
                <p className="text-gray-500">Completed projects will be shown here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.completed.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    linkTo={`/client/projects/${project._id}`}
                  />
                ))}
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Projects;
