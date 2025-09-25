import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProjectPhaseManager = ({ currentPhase, onProjectsUpdate }) => {
  const { user, token } = useAuth();
  const [currentProjects, setCurrentProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  useEffect(() => {
    if (currentPhase) {
      fetchCurrentProjects();
      fetchAvailableProjects();
    }
  }, [currentPhase]);

  const fetchCurrentProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/by-phase/${currentPhase}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const projects = await response.json();
        setCurrentProjects(projects);
        if (onProjectsUpdate) onProjectsUpdate(projects);
      }
    } catch (error) {
      console.error(`Error fetching ${currentPhase} projects:`, error);
    }
    setLoading(false);
  };

  const fetchAvailableProjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/available-for-phase/${currentPhase}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const projects = await response.json();
        setAvailableProjects(projects);
      }
    } catch (error) {
      console.error(`Error fetching available projects for ${currentPhase}:`, error);
    }
  };

  const transitionProject = async (projectId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/transition/${currentPhase}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Project transitioned to ${currentPhase} phase!`);
        fetchCurrentProjects();
        fetchAvailableProjects();
        setShowTransitionModal(false);
      } else {
        toast.error('Failed to transition project');
      }
    } catch (error) {
      console.error('Error transitioning project:', error);
      toast.error('Error transitioning project');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'initiation': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'execution': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-purple-100 text-purple-800';
      case 'closure': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-200 text-red-900';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'initiation': return <ClockIcon className="h-5 w-5" />;
      case 'planning': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'execution': return <ArrowRightIcon className="h-5 w-5" />;
      case 'monitoring': return <CheckCircleIcon className="h-5 w-5" />;
      case 'closure': return <CheckCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  if (loading && currentProjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getPhaseIcon(currentPhase)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {currentPhase} Projects
              </h2>
              <p className="text-sm text-gray-600">
                {currentProjects.length} project{currentProjects.length !== 1 ? 's' : ''} in this phase
              </p>
            </div>
          </div>
          
          {availableProjects.length > 0 && (
            <button
              onClick={() => setShowTransitionModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              data-testid="promote-project-btn"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Promote Project to {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
            </button>
          )}
        </div>
      </div>

      {/* Current Phase Projects */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Projects in {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
          </h3>
        </div>
        
        {currentProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              {getPhaseIcon(currentPhase)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects in {currentPhase} phase
            </h3>
            <p className="text-gray-500 mb-4">
              {availableProjects.length > 0 
                ? `You have ${availableProjects.length} project${availableProjects.length !== 1 ? 's' : ''} ready to promote to this phase.`
                : `No projects are ready for the ${currentPhase} phase yet.`}
            </p>
            {availableProjects.length > 0 && (
              <button
                onClick={() => setShowTransitionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Promote Project to {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentProjects.map((project) => (
              <div key={project.id} className="p-6 hover:bg-gray-50" data-testid={`project-${project.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority?.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-600 mb-3">{project.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      {project.start_date && (
                        <div>
                          <span className="font-medium">Start Date:</span> {new Date(project.start_date).toLocaleDateString()}
                        </div>
                      )}
                      {project.end_date && (
                        <div>
                          <span className="font-medium">End Date:</span> {new Date(project.end_date).toLocaleDateString()}
                        </div>
                      )}
                      {project.budget && (
                        <div>
                          <span className="font-medium">Budget:</span> ${project.budget.toLocaleString()}
                        </div>
                      )}
                      {project.completion_percentage !== undefined && (
                        <div>
                          <span className="font-medium">Progress:</span> {project.completion_percentage}%
                        </div>
                      )}
                      {project.methodology && (
                        <div>
                          <span className="font-medium">Methodology:</span> {project.methodology}
                        </div>
                      )}
                      {project.team_size && (
                        <div>
                          <span className="font-medium">Team Size:</span> {project.team_size} members
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowTransitionModal(false)}></div>
            
            <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Promote Project to {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
                </h3>
                <button onClick={() => setShowTransitionModal(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Select a project to promote to the {currentPhase} phase. Only projects from the appropriate previous phase are shown.
              </p>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availableProjects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-md font-medium text-gray-900">{project.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          Progress: {project.completion_percentage || 0}% • Priority: {project.priority?.toUpperCase()}
                        </div>
                      </div>
                      <button
                        onClick={() => transitionProject(project.id)}
                        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        data-testid={`promote-${project.id}`}
                      >
                        <ArrowRightIcon className="h-4 w-4 mr-1" />
                        Promote
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {availableProjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No projects are ready to be promoted to the {currentPhase} phase.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPhaseManager;