import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const PROJECT_STATUSES = [
  { value: 'initiation', label: 'Initiation' },
  { value: 'planning', label: 'Planning' },
  { value: 'execution', label: 'Execution' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'closure', label: 'Closure' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'initiation',
    priority: 'medium',
    start_date: '',
    end_date: '',
    budget: '',
    stakeholders: [],
    tags: [],
  });
  const [errors, setErrors] = useState({});
  const [currentTag, setCurrentTag] = useState('');
  const [currentStakeholder, setCurrentStakeholder] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate form
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }
    
    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      const response = await axios.post('/api/projects', projectData);
      
      toast.success('Project created successfully!');
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create project';
      toast.error(message);
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const addStakeholder = () => {
    if (currentStakeholder.trim() && !formData.stakeholders.includes(currentStakeholder.trim())) {
      setFormData(prev => ({
        ...prev,
        stakeholders: [...prev.stakeholders, currentStakeholder.trim()],
      }));
      setCurrentStakeholder('');
    }
  };

  const removeStakeholder = (stakeholderToRemove) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter(s => s !== stakeholderToRemove),
    }));
  };

  return (
    <div className="space-y-6" data-testid="create-project-form">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Create New Project
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up a new project in your portfolio
            </p>
          </div>
          <div className="mt-3 flex sm:mt-0 sm:ml-4">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              data-testid="cancel-create-project"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
        {errors.general && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{errors.general}</div>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Basic Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Provide the basic details about your project.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Project Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                    placeholder="Enter project name"
                    value={formData.name}
                    onChange={handleChange}
                    data-testid="project-name-input"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className={`form-input ${errors.description ? 'border-red-300' : ''}`}
                    placeholder="Describe your project..."
                    value={formData.description}
                    onChange={handleChange}
                    data-testid="project-description-input"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleChange}
                    data-testid="project-status-select"
                  >
                    {PROJECT_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <div className="mt-1">
                  <select
                    id="priority"
                    name="priority"
                    className="form-select"
                    value={formData.priority}
                    onChange={handleChange}
                    data-testid="project-priority-select"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline & Budget */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Timeline & Budget</h3>
            <p className="mt-1 text-sm text-gray-500">
              Set project timeline and budget information.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="start_date"
                  id="start_date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={handleChange}
                  data-testid="project-start-date-input"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="end_date"
                  id="end_date"
                  className={`form-input ${errors.end_date ? 'border-red-300' : ''}`}
                  value={formData.end_date}
                  onChange={handleChange}
                  data-testid="project-end-date-input"
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                Budget ($)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="budget"
                  id="budget"
                  min="0"
                  step="0.01"
                  className={`form-input ${errors.budget ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                  value={formData.budget}
                  onChange={handleChange}
                  data-testid="project-budget-input"
                />
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tags & Stakeholders */}
        <div className="pt-8">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Tags & Stakeholders</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add tags and stakeholder information for better organization.
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="mt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="form-input flex-1"
                    placeholder="Add a tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    data-testid="project-tag-input"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn-secondary"
                    data-testid="add-tag-button"
                  >
                    Add Tag
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        data-testid={`project-tag-${index}`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stakeholders */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stakeholders
              </label>
              <div className="mt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    className="form-input flex-1"
                    placeholder="Add stakeholder email..."
                    value={currentStakeholder}
                    onChange={(e) => setCurrentStakeholder(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addStakeholder();
                      }
                    }}
                    data-testid="project-stakeholder-input"
                  />
                  <button
                    type="button"
                    onClick={addStakeholder}
                    className="btn-secondary"
                    data-testid="add-stakeholder-button"
                  >
                    Add Stakeholder
                  </button>
                </div>
                {formData.stakeholders.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.stakeholders.map((stakeholder, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                        data-testid={`project-stakeholder-${index}`}
                      >
                        <span className="text-sm text-gray-700">{stakeholder}</span>
                        <button
                          type="button"
                          onClick={() => removeStakeholder(stakeholder)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              data-testid="cancel-create-project-form"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-create-project"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}