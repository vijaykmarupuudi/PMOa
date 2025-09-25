import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import TemplateSelector from './TemplateSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FeasibilityStudy = () => {
  const { id: projectId } = useParams();
  const { user, token } = useAuth();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: projectId,
    executive_summary: '',
    project_description: '',
    objectives: [''],
    scope: '',
    success_criteria: [''],
    technical_feasibility: {
      technology_requirements: '',
      technical_risks: [''],
      resource_requirements: {
        hardware: '',
        software: '',
        personnel: '',
        infrastructure: ''
      },
      technical_assessment: ''
    },
    economic_feasibility: {
      cost_analysis: {
        initial_investment: '',
        ongoing_costs: '',
        total_cost_of_ownership: ''
      },
      benefit_analysis: {
        quantified_benefits: '',
        intangible_benefits: '',
        cost_savings: ''
      },
      financial_metrics: {
        roi: '',
        payback_period: '',
        npv: '',
        break_even_point: ''
      },
      economic_assessment: ''
    },
    operational_feasibility: {
      organizational_readiness: '',
      process_impact: '',
      user_acceptance: '',
      operational_requirements: {
        staffing: '',
        training: '',
        support: '',
        procedures: ''
      },
      operational_risks: [''],
      operational_assessment: ''
    },
    schedule_feasibility: {
      project_timeline: '',
      critical_path: '',
      resource_availability: '',
      external_dependencies: '',
      schedule_risks: [''],
      schedule_assessment: ''
    },
    alternative_analysis: [
      {
        alternative: 'Do Nothing',
        description: '',
        pros: [''],
        cons: ['']
      }
    ],
    recommendations: {
      feasibility_rating: '',
      recommendation: '',
      justification: '',
      next_steps: [''],
      success_factors: ['']
    }
  });

  useEffect(() => {
    fetchStudy();
  }, [projectId]);

  const fetchStudy = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/feasibility-study/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudy(data);
        setFormData(data);
        setEditing(false);
      } else if (response.status === 404) {
        setEditing(true);
      }
    } catch (error) {
      console.error('Error fetching feasibility study:', error);
      setEditing(true);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathArray = path.split('.');
      let current = newData;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleNestedArrayChange = (path, index, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathArray = path.split('.');
      let current = newData;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      
      const arrayField = current[pathArray[pathArray.length - 1]];
      current[pathArray[pathArray.length - 1]] = arrayField.map((item, i) => i === index ? value : item);
      return newData;
    });
  };

  const addArrayItem = (field, defaultValue = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue]
    }));
  };

  const addNestedArrayItem = (path, defaultValue = '') => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathArray = path.split('.');
      let current = newData;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      
      current[pathArray[pathArray.length - 1]] = [...current[pathArray[pathArray.length - 1]], defaultValue];
      return newData;
    });
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const removeNestedArrayItem = (path, index) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathArray = path.split('.');
      let current = newData;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      
      current[pathArray[pathArray.length - 1]] = current[pathArray[pathArray.length - 1]].filter((_, i) => i !== index);
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = study 
        ? `${BACKEND_URL}/api/feasibility-study/${study.id}`
        : `${BACKEND_URL}/api/feasibility-study`;
      
      const method = study ? 'PUT' : 'POST';

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
        setStudy(data);
        setEditing(false);
        toast.success(study ? 'Feasibility study updated successfully!' : 'Feasibility study created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save feasibility study');
      }
    } catch (error) {
      console.error('Error saving feasibility study:', error);
      toast.error('Failed to save feasibility study');
    }
    
    setSaving(false);
  };

  const handleTemplateApplied = (result) => {
    fetchStudy();
    toast.success('Template applied! Feasibility study structure has been created.');
  };

  const renderArrayField = (label, field, placeholder, isNested = false, path = '') => {
    const arrayData = isNested ? formData[path.split('.')[0]][path.split('.')[1]] : formData[field];
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        {arrayData.map((item, index) => (
          <div key={index} className="flex mb-2">
            <textarea
              value={item}
              onChange={(e) => 
                isNested 
                  ? handleNestedArrayChange(path, index, e.target.value)
                  : handleArrayChange(field, index, e.target.value)
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={placeholder}
              rows={2}
              disabled={!editing}
            />
            {editing && (
              <button
                type="button"
                onClick={() => 
                  isNested 
                    ? removeNestedArrayItem(path, index)
                    : removeArrayItem(field, index)
                }
                className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {editing && (
          <button
            type="button"
            onClick={() => 
              isNested 
                ? addNestedArrayItem(path, '')
                : addArrayItem(field, '')
            }
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add {label.split(' ').pop()}
          </button>
        )}
      </div>
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Feasibility Study</h1>
            <p className="mt-1 text-sm text-gray-600">
              {study ? 'View and manage' : 'Create'} the project feasibility analysis
            </p>
          </div>
          <div className="flex space-x-3">
            {!study && (
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                data-testid="use-feasibility-template-btn"
              >
                📋 Use Template
              </button>
            )}
            {study && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                data-testid="edit-feasibility-btn"
              >
                Edit Study
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
          {/* Executive Summary */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
            <textarea
              name="executive_summary"
              value={formData.executive_summary}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide a high-level overview of the feasibility study findings"
              disabled={!editing}
              data-testid="executive-summary-input"
            />
          </div>

          {/* Project Overview */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                <textarea
                  name="project_description"
                  value={formData.project_description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed description of the proposed project"
                  disabled={!editing}
                  data-testid="project-description-input"
                />
              </div>
              {renderArrayField('Objectives', 'objectives', 'Enter project objective')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
                <textarea
                  name="scope"
                  value={formData.scope}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Define project scope"
                  disabled={!editing}
                  data-testid="scope-input"
                />
              </div>
              {renderArrayField('Success Criteria', 'success_criteria', 'Enter success criteria')}
            </div>
          </div>

          {/* Technical Feasibility */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Feasibility</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Technology Requirements</label>
                <textarea
                  value={formData.technical_feasibility.technology_requirements}
                  onChange={(e) => handleNestedChange('technical_feasibility.technology_requirements', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Required technologies, systems, and infrastructure"
                  disabled={!editing}
                />
              </div>
              {renderArrayField('Technical Risks', '', 'Describe technical risk', true, 'technical_feasibility.technical_risks')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Technical Assessment</label>
                <textarea
                  value={formData.technical_feasibility.technical_assessment}
                  onChange={(e) => handleNestedChange('technical_feasibility.technical_assessment', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Overall technical feasibility assessment"
                  disabled={!editing}
                />
              </div>
            </div>
          </div>

          {/* Economic Feasibility */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Economic Feasibility</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">Financial Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ROI</label>
                    <input
                      type="text"
                      value={formData.economic_feasibility.financial_metrics.roi}
                      onChange={(e) => handleNestedChange('economic_feasibility.financial_metrics.roi', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Return on Investment"
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payback Period</label>
                    <input
                      type="text"
                      value={formData.economic_feasibility.financial_metrics.payback_period}
                      onChange={(e) => handleNestedChange('economic_feasibility.financial_metrics.payback_period', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Expected payback timeline"
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Economic Assessment</label>
                <textarea
                  value={formData.economic_feasibility.economic_assessment}
                  onChange={(e) => handleNestedChange('economic_feasibility.economic_assessment', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Overall economic feasibility assessment"
                  disabled={!editing}
                />
              </div>
            </div>
          </div>

          {/* Operational Feasibility */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Operational Feasibility</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organizational Readiness</label>
                <textarea
                  value={formData.operational_feasibility.organizational_readiness}
                  onChange={(e) => handleNestedChange('operational_feasibility.organizational_readiness', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Assessment of organizational capability"
                  disabled={!editing}
                />
              </div>
              {renderArrayField('Operational Risks', '', 'Describe operational risk', true, 'operational_feasibility.operational_risks')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operational Assessment</label>
                <textarea
                  value={formData.operational_feasibility.operational_assessment}
                  onChange={(e) => handleNestedChange('operational_feasibility.operational_assessment', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Overall operational feasibility assessment"
                  disabled={!editing}
                />
              </div>
            </div>
          </div>

          {/* Schedule Feasibility */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Feasibility</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Timeline</label>
                <textarea
                  value={formData.schedule_feasibility.project_timeline}
                  onChange={(e) => handleNestedChange('schedule_feasibility.project_timeline', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="High-level project schedule and milestones"
                  disabled={!editing}
                />
              </div>
              {renderArrayField('Schedule Risks', '', 'Describe schedule risk', true, 'schedule_feasibility.schedule_risks')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Assessment</label>
                <textarea
                  value={formData.schedule_feasibility.schedule_assessment}
                  onChange={(e) => handleNestedChange('schedule_feasibility.schedule_assessment', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Overall schedule feasibility assessment"
                  disabled={!editing}
                />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feasibility Rating</label>
                  <select
                    value={formData.recommendations.feasibility_rating}
                    onChange={(e) => handleNestedChange('recommendations.feasibility_rating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={!editing}
                  >
                    <option value="">Select Rating</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
                <textarea
                  value={formData.recommendations.recommendation}
                  onChange={(e) => handleNestedChange('recommendations.recommendation', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Recommended course of action"
                  disabled={!editing}
                />
              </div>
              {renderArrayField('Next Steps', '', 'Enter next step', true, 'recommendations.next_steps')}
              {renderArrayField('Success Factors', '', 'Enter success factor', true, 'recommendations.success_factors')}
            </div>
          </div>

          {editing && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (study) {
                    setFormData(study);
                    setEditing(false);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                data-testid="save-feasibility-btn"
              >
                {saving ? 'Saving...' : (study ? 'Update Study' : 'Create Study')}
              </button>
            </div>
          )}
        </form>
      </div>
      
      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        templateType="feasibility_study"
        projectId={projectId}
        onTemplateApplied={handleTemplateApplied}
      />
    </div>
  );
};

export default FeasibilityStudy;