import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/projects/${projectId}`);
      toast.success('Project deleted successfully');
      fetchProjects(); // Refresh the list
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to delete project';
      toast.error(message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      initiation: 'bg-gray-100 text-gray-800',
      planning: 'bg-blue-100 text-blue-800',
      execution: 'bg-yellow-100 text-yellow-800',
      monitoring: 'bg-orange-100 text-orange-800',
      closure: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatPriority = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const canDeleteProject = (project) => {
    return (
      user?.role === 'executive' ||
      (user?.role === 'project_manager' && project.project_manager_id === user.id) ||
      project.created_by === user.id
    );
  };

  // Filter projects based on search and filter criteria
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="space-y-6" data-testid="projects-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="projects-list">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Projects
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your project portfolio
            </p>
          </div>
          <div className="mt-3 flex sm:mt-0 sm:ml-4">
            <Link
              to="/projects/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              data-testid="create-project-button"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4" data-testid="project-filters">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Projects
            </label>
            <input
              type="text"
              id="search"
              className="form-input"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-projects-input"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="filter-status-select"
            >
              <option value="all">All Statuses</option>
              <option value="initiation">Initiation</option>
              <option value="planning">Planning</option>
              <option value="execution">Execution</option>
              <option value="monitoring">Monitoring</option>
              <option value="closure">Closure</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              data-testid="filter-priority-select"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span data-testid="project-count">
            Showing {filteredProjects.length} of {projects.length} projects
          </span>
          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="text-blue-600 hover:text-blue-500"
              data-testid="clear-filters-button"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12" data-testid="no-projects-found">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length === 0 
              ? 'Get started by creating your first project.'
              : 'Try adjusting your search criteria or clearing filters.'
            }
          </p>
          {projects.length === 0 && (
            <div className="mt-6">
              <Link
                to="/projects/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                data-testid="create-first-project-button"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Project
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              data-testid={`project-card-${project.id}`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {formatStatus(project.status)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {formatPriority(project.priority)}
                    </span>
                  </div>
                  
                  {canDeleteProject(project) && (
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Delete project"
                      data-testid={`delete-project-${project.id}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="mt-3">
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-lg font-medium text-gray-900 hover:text-blue-600 block"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {project.description}
                  </p>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span>Progress</span>
                    <span>{project.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <div className="font-medium">{formatDate(project.start_date)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">End Date:</span>
                    <div className="font-medium">{formatDate(project.end_date)}</div>
                  </div>
                </div>
                
                {project.budget > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Budget:</span>
                    <span className="font-medium ml-1">${project.budget.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created {formatDate(project.created_at)}
                  </div>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    data-testid={`view-project-${project.id}`}
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}