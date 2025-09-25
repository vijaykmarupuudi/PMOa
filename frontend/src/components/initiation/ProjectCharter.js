import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import TemplateSelector from './TemplateSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProjectCharter = () => {
  const { id: projectId } = useParams();
  const { user, token } = useAuth();
  const [charter, setCharter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: projectId,
    project_purpose: '',
    project_description: '',
    project_objectives: [''],
    success_criteria: [''],
    scope_inclusions: [''],
    scope_exclusions: [''],
    assumptions: [''],
    constraints: [''],
    estimated_budget: 0,
    estimated_timeline: '',
    key_milestones: [{ name: '', date: '', description: '' }]
  });

  useEffect(() => {
    fetchCharter();
  }, [projectId]);

  const fetchCharter = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/project-charter/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCharter(data);
        setFormData(data);
        setEditing(false);
      } else if (response.status === 404) {
        // Charter doesn't exist yet
        setEditing(true);
      }
    } catch (error) {
      console.error('Error fetching charter:', error);
      setEditing(true);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field, defaultValue = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      key_milestones: prev.key_milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      key_milestones: [...prev.key_milestones, { name: '', date: '', description: '' }]
    }));
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      key_milestones: prev.key_milestones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = charter 
        ? `${BACKEND_URL}/api/project-charter/${charter.id}`
        : `${BACKEND_URL}/api/project-charter`;
      
      const method = charter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setCharter(data);
        setEditing(false);
        toast.success(charter ? 'Charter updated successfully!' : 'Charter created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save charter');
      }
    } catch (error) {
      console.error('Error saving charter:', error);
      toast.error('Failed to save charter');
    }
    
    setSaving(false);
  };

  const renderArrayField = (label, field, placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {formData[field].map((item, index) => (
        <div key={index} className="flex mb-2">
          <input
            type="text"
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder={placeholder}
            disabled={!editing}
            data-testid={`${field}-input-${index}`}
          />
          {editing && (
            <button
              type="button"
              onClick={() => removeArrayItem(field, index)}
              className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
              data-testid={`remove-${field}-${index}`}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {editing && (
        <button
          type="button"
          onClick={() => addArrayItem(field, '')}
          className="text-sm text-blue-600 hover:text-blue-800"
          data-testid={`add-${field}`}
        >
          + Add {label.split(' ').pop()}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Charter</h1>
            <p className="mt-1 text-sm text-gray-600">
              {charter ? 'View and manage' : 'Create'} the project charter
            </p>
          </div>
          {charter && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              data-testid="edit-charter-btn"
            >
              Edit Charter
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="project_purpose" className="block text-sm font-medium text-gray-700 mb-2">
                Project Purpose *
              </label>
              <textarea
                id="project_purpose"
                name="project_purpose"
                value={formData.project_purpose}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the purpose of this project"
                required
                disabled={!editing}
                data-testid="project-purpose-input"
              />
            </div>

            <div>
              <label htmlFor="project_description" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                id="project_description"
                name="project_description"
                value={formData.project_description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide a detailed description of the project"
                required
                disabled={!editing}
                data-testid="project-description-input"
              />
            </div>

            {renderArrayField('Project Objectives', 'project_objectives', 'Enter project objective')}
            {renderArrayField('Success Criteria', 'success_criteria', 'Enter success criteria')}
            {renderArrayField('Scope Inclusions', 'scope_inclusions', 'What is included in scope')}
            {renderArrayField('Scope Exclusions', 'scope_exclusions', 'What is excluded from scope')}
            {renderArrayField('Assumptions', 'assumptions', 'Enter assumption')}
            {renderArrayField('Constraints', 'constraints', 'Enter constraint')}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="estimated_budget" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Budget
                </label>
                <input
                  type="number"
                  id="estimated_budget"
                  name="estimated_budget"
                  value={formData.estimated_budget}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={!editing}
                  data-testid="estimated-budget-input"
                />
              </div>

              <div>
                <label htmlFor="estimated_timeline" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Timeline
                </label>
                <input
                  type="text"
                  id="estimated_timeline"
                  name="estimated_timeline"
                  value={formData.estimated_timeline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 6 months"
                  disabled={!editing}
                  data-testid="estimated-timeline-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Milestones
              </label>
              {formData.key_milestones.map((milestone, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-md">
                  <div>
                    <input
                      type="text"
                      value={milestone.name}
                      onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Milestone name"
                      disabled={!editing}
                      data-testid={`milestone-name-${index}`}
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={milestone.date}
                      onChange={(e) => handleMilestoneChange(index, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={!editing}
                      data-testid={`milestone-date-${index}`}
                    />
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description"
                      disabled={!editing}
                      data-testid={`milestone-description-${index}`}
                    />
                    {editing && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                        data-testid={`remove-milestone-${index}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  data-testid="add-milestone"
                >
                  + Add Milestone
                </button>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (charter) {
                    setFormData(charter);
                    setEditing(false);
                  } else {
                    setFormData({
                      project_id: projectId,
                      project_purpose: '',
                      project_description: '',
                      project_objectives: [''],
                      success_criteria: [''],
                      scope_inclusions: [''],
                      scope_exclusions: [''],
                      assumptions: [''],
                      constraints: [''],
                      estimated_budget: 0,
                      estimated_timeline: '',
                      key_milestones: [{ name: '', date: '', description: '' }]
                    });
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                data-testid="cancel-charter-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                data-testid="save-charter-btn"
              >
                {saving ? 'Saving...' : (charter ? 'Update Charter' : 'Create Charter')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProjectCharter;