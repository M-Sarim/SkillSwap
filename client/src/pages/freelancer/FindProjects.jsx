import { useState, useEffect, useContext } from 'react';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';
import useApi from '../../hooks/useApi';
import ProjectCard from '../../components/common/ProjectCard';
import BidForm from '../../components/freelancer/BidForm';
import { toast } from 'react-toastify';

const FindProjects = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { get, loading, error } = useApi();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    budget: 'all',
    skills: [],
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [categories, setCategories] = useState([]);
  const [skillsList, setSkillsList] = useState([]);

  const fetchProjects = async () => {
    try {
      // Fetch open projects
      const response = await get('/projects', { status: 'Open' });
      if (response.success) {
        setProjects(response.data.projects);
        setFilteredProjects(response.data.projects);

        // Extract unique categories and skills
        const uniqueCategories = [...new Set(response.data.projects.map(project => project.category))];
        setCategories(['all', ...uniqueCategories]);

        const allSkills = response.data.projects.flatMap(project => project.skills);
        const uniqueSkills = [...new Set(allSkills)];
        setSkillsList(uniqueSkills);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [get]);

  // Listen for bid acceptance events
  useEffect(() => {
    if (!socket) return;

    const handleBidAccepted = (data) => {
      // Show notification
      toast.success(data.message, {
        position: "top-right",
        autoClose: 5000
      });

      // Refresh projects list to remove the project that was just assigned
      fetchProjects();
    };

    socket.on('yourBidAccepted', handleBidAccepted);

    // Also listen for general bid acceptance updates to refresh the project list
    socket.on('bidAcceptedUpdate', () => {
      fetchProjects();
    });

    return () => {
      socket.off('yourBidAccepted', handleBidAccepted);
      socket.off('bidAcceptedUpdate');
    };
  }, [socket]);

  useEffect(() => {
    // Apply filters and search
    let result = [...projects];

    // Apply search
    if (searchTerm) {
      result = result.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      result = result.filter(project => project.category === filters.category);
    }

    // Apply budget filter
    if (filters.budget !== 'all') {
      if (filters.budget === 'under500') {
        result = result.filter(project => project.budget < 500);
      } else if (filters.budget === '500to1000') {
        result = result.filter(project => project.budget >= 500 && project.budget <= 1000);
      } else if (filters.budget === '1000to5000') {
        result = result.filter(project => project.budget > 1000 && project.budget <= 5000);
      } else if (filters.budget === 'over5000') {
        result = result.filter(project => project.budget > 5000);
      }
    }

    // Apply skills filter
    if (filters.skills.length > 0) {
      result = result.filter(project =>
        filters.skills.some(skill => project.skills.includes(skill))
      );
    }

    // Apply sorting
    if (filters.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (filters.sortBy === 'budget-high') {
      result.sort((a, b) => b.budget - a.budget);
    } else if (filters.sortBy === 'budget-low') {
      result.sort((a, b) => a.budget - b.budget);
    } else if (filters.sortBy === 'deadline') {
      result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }

    setFilteredProjects(result);
  }, [projects, searchTerm, filters]);

  const handleBidClick = (project) => {
    setSelectedProject(project);
    setShowBidForm(true);
  };

  const handleSkillToggle = (skill) => {
    setFilters(prevFilters => {
      const skills = [...prevFilters.skills];
      if (skills.includes(skill)) {
        return { ...prevFilters, skills: skills.filter(s => s !== skill) };
      } else {
        return { ...prevFilters, skills: [...skills, skill] };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Find Projects</h1>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => setShowFilters(!showFilters)}
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-gray-500" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search projects"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              id="sort-by"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="budget-high">Budget: High to Low</option>
              <option value="budget-low">Budget: Low to High</option>
              <option value="deadline">Deadline: Soonest First</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="budget-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <select
                  id="budget-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.budget}
                  onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                >
                  <option value="all">All Budgets</option>
                  <option value="under500">Under $500</option>
                  <option value="500to1000">$500 - $1,000</option>
                  <option value="1000to5000">$1,000 - $5,000</option>
                  <option value="over5000">Over $5,000</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {skillsList.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    className={`inline-flex items-center px-2.5 py-1.5 border rounded-full text-xs font-medium ${
                      filters.skills.includes(skill)
                        ? 'bg-primary-100 text-primary-800 border-primary-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                    }`}
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <div key={project._id} className="flex flex-col h-full">
                <ProjectCard
                  project={project}
                  linkTo={`/freelancer/projects/${project._id}`}
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => handleBidClick(project)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Place a Bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filters.category !== 'all' || filters.budget !== 'all' || filters.skills.length > 0
                ? 'Try adjusting your search or filters'
                : 'There are no open projects available at the moment'}
            </p>
          </div>
        )}
      </div>

      {/* Bid Form Modal */}
      {showBidForm && selectedProject && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Place a Bid on "{selectedProject.title}"
                    </h3>
                    <div className="mt-4">
                      <BidForm
                        project={selectedProject}
                        onClose={() => setShowBidForm(false)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindProjects;
