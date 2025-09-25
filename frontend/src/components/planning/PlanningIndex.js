import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PlanningIndex = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const projectData = await response.json();
        setProjects(projectData);
      } else {
        toast.error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'initiation':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'execution':
        return 'bg-green-100 text-green-800';
      case 'monitoring':
        return 'bg-purple-100 text-purple-800';
      case 'closure':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const planningFeatures = [
    {
      name: 'Work Breakdown Structure',
      description: 'Organize project work into manageable tasks and subtasks',
      icon: ClipboardDocumentListIcon,
      status: 'available',
      color: 'text-green-600'
    },
    {
      name: 'Risk Management',
      description: 'Identify, assess, and manage project risks',
      icon: ExclamationTriangleIcon,
      status: 'available',
      color: 'text-green-600'
    },
    {
      name: 'Budget Planning',
      description: 'Plan and track project budget across categories',
      icon: CurrencyDollarIcon,
      status: 'available',
      color: 'text-green-600'
    },
    {
      name: 'Timeline & Gantt',
      description: 'Visual project timeline and dependencies',
      icon: CalendarDaysIcon,
      status: 'coming_soon',
      color: 'text-gray-400'
    },
    {
      name: 'Communication Plan',
      description: 'Stakeholder communication planning',
      icon: ChatBubbleLeftRightIcon,
      status: 'coming_soon',
      color: 'text-gray-400'
    },
    {
      name: 'Quality & Procurement',
      description: 'Quality assurance and procurement planning',
      icon: DocumentTextIcon,
      status: 'coming_soon',
      color: 'text-gray-400'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Planning Module</h1>
        <p className="mt-2 text-lg text-gray-600">
          Module 2 of the PMO framework - Plan project work, manage risks, and establish budgets
        </p>
      </div>

      {/* Planning Features Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Planning Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planningFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.name} className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Icon className={`h-6 w-6 ${feature.color} mr-3`} />
                  <h3 className="text-sm font-medium text-gray-900">{feature.name}</h3>
                  {feature.status === 'available' && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  )}
                  {feature.status === 'coming_soon' && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Selection */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select a Project for Planning</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose a project to access planning tools and features
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects available</h3>
            <p className="text-gray-500 mb-4">Create a project first to access planning features.</p>
            <button
              onClick={() => navigate('/projects/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <div key={project.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority?.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    {project.description && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      {project.start_date && (
                        <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                      )}
                      {project.end_date && (
                        <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                      )}
                      {project.budget && (
                        <span>Budget: ${project.budget.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => navigate(`/planning/${project.id}`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Open Planning
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module Progress */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Module 2 Development Progress</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Planning Module Completion</span>
            <span className="text-sm font-medium text-blue-600">50% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">✅ Completed Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Work Breakdown Structure (WBS)</li>
                <li>• Risk Management System</li>
                <li>• Budget Planning & Tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">🚧 Upcoming Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Interactive Gantt Charts</li>
                <li>• Communication Planning</li>
                <li>• Quality & Procurement Templates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningIndex;