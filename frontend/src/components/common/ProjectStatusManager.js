import React, { useState } from 'react';
import { 
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProjectStatusManager = ({ project, onStatusUpdate, showTransitionButton = true }) => {
  const [updating, setUpdating] = useState(false);

  const statusConfig = {
    initiation: {
      name: 'Initiation',
      color: 'bg-blue-100 text-blue-800',
      description: 'Project setup and charter creation',
      nextStatus: 'planning',
      nextLabel: 'Move to Planning'
    },
    planning: {
      name: 'Planning',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Work breakdown, timeline, and resource planning',
      nextStatus: 'execution',
      nextLabel: 'Start Execution'
    },
    execution: {
      name: 'Execution',
      color: 'bg-green-100 text-green-800',
      description: 'Project work implementation and delivery',
      nextStatus: 'monitoring',
      nextLabel: 'Move to Monitoring'
    },
    monitoring: {
      name: 'Monitoring',
      color: 'bg-purple-100 text-purple-800',
      description: 'Performance tracking and control',
      nextStatus: 'closure',
      nextLabel: 'Begin Closure'
    },
    closure: {
      name: 'Closure',
      color: 'bg-gray-100 text-gray-800',
      description: 'Project completion and handover',
      nextStatus: 'completed',
      nextLabel: 'Mark Complete'
    },
    completed: {
      name: 'Completed',
      color: 'bg-green-100 text-green-800',
      description: 'Project successfully completed',
      nextStatus: null,
      nextLabel: null
    },
    cancelled: {
      name: 'Cancelled',
      color: 'bg-red-100 text-red-800',
      description: 'Project was cancelled',
      nextStatus: 'initiation',
      nextLabel: 'Restart Project'
    }
  };

  const currentConfig = statusConfig[project.status] || statusConfig.initiation;

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${project.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Project moved to ${statusConfig[newStatus]?.name || newStatus}`);
        if (onStatusUpdate) {
          onStatusUpdate(newStatus);
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update project status');
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Error updating project status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusTimeline = () => {
    const allStatuses = ['initiation', 'planning', 'execution', 'monitoring', 'closure', 'completed'];
    const currentIndex = allStatuses.indexOf(project.status);
    
    return allStatuses.map((status, index) => ({
      status,
      ...statusConfig[status],
      isActive: status === project.status,
      isCompleted: index < currentIndex,
      isFuture: index > currentIndex
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Status</h3>
          <p className="text-sm text-gray-600">Track project progression through PMO phases</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentConfig.color}`}>
          {currentConfig.name}
        </span>
      </div>

      {/* Status Timeline */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {getStatusTimeline().map((statusItem, index) => (
            <React.Fragment key={statusItem.status}>
              <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  statusItem.isCompleted
                    ? 'bg-green-500 text-white'
                    : statusItem.isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {statusItem.isCompleted ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${
                    statusItem.isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {statusItem.name}
                  </div>
                </div>
              </div>
              {index < getStatusTimeline().length - 1 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current Status Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">{currentConfig.description}</p>
      </div>

      {/* Status Transition Button */}
      {showTransitionButton && currentConfig.nextStatus && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Ready to move to the next phase?
          </div>
          <button
            onClick={() => handleStatusUpdate(currentConfig.nextStatus)}
            disabled={updating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <>
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                {currentConfig.nextLabel}
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Completed Status */}
      {project.status === 'completed' && (
        <div className="flex items-center text-green-600">
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Project completed successfully!</span>
        </div>
      )}

      {/* Cancelled Status */}
      {project.status === 'cancelled' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center text-red-600">
            <XCircleIcon className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Project was cancelled</span>
          </div>
          {showTransitionButton && (
            <button
              onClick={() => handleStatusUpdate('initiation')}
              disabled={updating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  Restart Project
                  <ArrowPathIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectStatusManager;