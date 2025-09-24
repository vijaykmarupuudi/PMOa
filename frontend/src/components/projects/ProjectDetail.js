import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setProject(response.data);
      setEditForm(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      toast.error('Project not found');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(`/api/projects/${id}`, editForm);
      setProject(response.data);
      setIsEditing(false);
      toast.success('Project updated successfully');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update project';
      toast.error(message);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/projects/${id}`);
      toast.success('Project deleted successfully');
      navigate('/projects');
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

  const canEditProject = () => {
    return (
      user?.role === 'executive' ||
      (user?.role === 'project_manager' && project?.project_manager_id === user.id) ||
      project?.created_by === user.id
    );
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="project-detail-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="project-detail-content">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/projects')}
              className="text-gray-400 hover:text-gray-600"
              data-testid="back-to-projects-button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {project.name}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {formatStatus(project.status)}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {formatPriority(project.priority)}
                </span>
              </div>
            </div>
          </div>
          
          {canEditProject() && (
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    data-testid="cancel-edit-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    data-testid="save-edit-button"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    data-testid="edit-project-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    data-testid="delete-project-button"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <div className="bg-white overflow-hidden shadow rounded-lg" data-testid="project-overview">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Project Overview</h3>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      className="mt-1 form-input"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      data-testid="edit-project-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={4}
                      className="mt-1 form-input"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      data-testid="edit-project-description"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 leading-6">{project.description}</p>
                </div>
              )}
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                  <span>Progress</span>
                  <span>{project.completion_percentage}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.completion_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Modules */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Project Modules</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { name: 'Initiation', desc: 'Charter, Business Case, Stakeholder Register' },
                  { name: 'Planning', desc: 'WBS, Timeline, Risk Management' },
                  { name: 'Execution', desc: 'Deliverables, Issues, Status Tracking' },
                  { name: 'Monitoring', desc: 'Variance Reports, Change Requests' },
                  { name: 'Closure', desc: 'Final Deliverables, Sign-offs, Lessons' },
                ].map((module) => (
                  <div key={module.name} className="border border-gray-200 rounded-lg p-4 opacity-60">
                    <h4 className="font-medium text-gray-900">{module.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{module.desc}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                      Coming Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Details */}
          <div className="bg-white overflow-hidden shadow rounded-lg" data-testid="project-details-sidebar">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Project Details</h3>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    {isEditing ? (
                      <select
                        className="form-select w-full"
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        data-testid="edit-project-status"
                      >
                        <option value="initiation">Initiation</option>
                        <option value="planning">Planning</option>
                        <option value="execution">Execution</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="closure">Closure</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {formatStatus(project.status)}
                      </span>
                    )}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1">
                    {isEditing ? (
                      <select
                        className="form-select w-full"
                        value={editForm.priority || ''}
                        onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                        data-testid="edit-project-priority"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                        {formatPriority(project.priority)}
                      </span>
                    )}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-input w-full"
                        value={editForm.start_date ? new Date(editForm.start_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditForm({...editForm, start_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                        data-testid="edit-project-start-date"
                      />
                    ) : (
                      formatDate(project.start_date)
                    )}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-input w-full"
                        value={editForm.end_date ? new Date(editForm.end_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditForm({...editForm, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                        data-testid="edit-project-end-date"
                      />
                    ) : (
                      formatDate(project.end_date)
                    )}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Budget</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input w-full"
                        value={editForm.budget || ''}
                        onChange={(e) => setEditForm({...editForm, budget: parseFloat(e.target.value) || 0})}
                        data-testid="edit-project-budget"
                      />
                    ) : (
                      project.budget > 0 ? `$${project.budget.toLocaleString()}` : 'Not set'
                    )}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.created_at)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.updated_at)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stakeholders */}
          {project.stakeholders && project.stakeholders.length > 0 && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Stakeholders</h3>
                <div className="space-y-2">
                  {project.stakeholders.map((stakeholder, index) => (
                    <div
                      key={index}
                      className="flex items-center px-3 py-2 bg-gray-50 rounded-md"
                    >
                      <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-gray-600">
                          {stakeholder.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">{stakeholder}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}