import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BusinessCase = () => {
  const { id: projectId } = useParams();
  const { user, token } = useAuth();
  const [businessCase, setBusinessCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: projectId,
    problem_statement: '',
    proposed_solution: '',
    business_need: '',
    expected_benefits: [''],
    cost_benefit_analysis: {
      costs: [],
      benefits: [],
      roi_percentage: '',
      payback_period: ''
    },
    risk_assessment: [''],
    alternatives_considered: [''],
    recommendation: '',
    return_on_investment: ''
  });

  useEffect(() => {
    fetchBusinessCase();
  }, [projectId]);

  const fetchBusinessCase = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/business-case/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessCase(data);
        setFormData(data);
        setEditing(false);
      } else if (response.status === 404) {
        setEditing(true);
      }
    } catch (error) {
      console.error('Error fetching business case:', error);
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

  const handleCostBenefitChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      cost_benefit_analysis: {
        ...prev.cost_benefit_analysis,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = businessCase 
        ? `${BACKEND_URL}/api/business-case/${businessCase.id}`
        : `${BACKEND_URL}/api/business-case`;
      
      const method = businessCase ? 'PUT' : 'POST';

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
        setBusinessCase(data);
        setEditing(false);
        toast.success(businessCase ? 'Business case updated successfully!' : 'Business case created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save business case');
      }
    } catch (error) {
      console.error('Error saving business case:', error);
      toast.error('Failed to save business case');
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
          <textarea
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder={placeholder}
            rows={2}
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
            <h1 className="text-2xl font-bold text-gray-900">Business Case</h1>
            <p className="mt-1 text-sm text-gray-600">
              {businessCase ? 'View and manage' : 'Create'} the project business case
            </p>
          </div>
          {businessCase && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              data-testid="edit-business-case-btn"
            >
              Edit Business Case
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="problem_statement" className="block text-sm font-medium text-gray-700 mb-2">
                Problem Statement *
              </label>
              <textarea
                id="problem_statement"
                name="problem_statement"
                value={formData.problem_statement}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the problem this project will solve"
                required
                disabled={!editing}
                data-testid="problem-statement-input"
              />
            </div>

            <div>
              <label htmlFor="business_need" className="block text-sm font-medium text-gray-700 mb-2">
                Business Need *
              </label>
              <textarea
                id="business_need"
                name="business_need"
                value={formData.business_need}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explain the business need driving this project"
                required
                disabled={!editing}
                data-testid="business-need-input"
              />
            </div>

            <div>
              <label htmlFor="proposed_solution" className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Solution *
              </label>
              <textarea
                id="proposed_solution"
                name="proposed_solution"
                value={formData.proposed_solution}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the proposed solution"
                required
                disabled={!editing}
                data-testid="proposed-solution-input"
              />
            </div>

            {renderArrayField('Expected Benefits', 'expected_benefits', 'Describe expected benefit')}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost-Benefit Analysis
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-md">
                <div>
                  <label htmlFor="roi_percentage" className="block text-sm font-medium text-gray-600 mb-1">
                    Expected ROI (%)
                  </label>
                  <input
                    type="text"
                    id="roi_percentage"
                    value={formData.cost_benefit_analysis.roi_percentage}
                    onChange={(e) => handleCostBenefitChange('roi', 'roi_percentage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 15%"
                    disabled={!editing}
                    data-testid="roi-percentage-input"
                  />
                </div>
                <div>
                  <label htmlFor="payback_period" className="block text-sm font-medium text-gray-600 mb-1">
                    Payback Period
                  </label>
                  <input
                    type="text"
                    id="payback_period"
                    value={formData.cost_benefit_analysis.payback_period}
                    onChange={(e) => handleCostBenefitChange('period', 'payback_period', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 18 months"
                    disabled={!editing}
                    data-testid="payback-period-input"
                  />
                </div>
              </div>
            </div>

            {renderArrayField('Risk Assessment', 'risk_assessment', 'Identify potential risk')}
            {renderArrayField('Alternatives Considered', 'alternatives_considered', 'Describe alternative approach')}

            <div>
              <label htmlFor="recommendation" className="block text-sm font-medium text-gray-700 mb-2">
                Recommendation *
              </label>
              <textarea
                id="recommendation"
                name="recommendation"
                value={formData.recommendation}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide your recommendation"
                required
                disabled={!editing}
                data-testid="recommendation-input"
              />
            </div>

            <div>
              <label htmlFor="return_on_investment" className="block text-sm font-medium text-gray-700 mb-2">
                Return on Investment Details
              </label>
              <textarea
                id="return_on_investment"
                name="return_on_investment"
                value={formData.return_on_investment}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed ROI analysis and projections"
                disabled={!editing}
                data-testid="roi-details-input"
              />
            </div>
          </div>

          {editing && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (businessCase) {
                    setFormData(businessCase);
                    setEditing(false);
                  } else {
                    setFormData({
                      project_id: projectId,
                      problem_statement: '',
                      proposed_solution: '',
                      business_need: '',
                      expected_benefits: [''],
                      cost_benefit_analysis: {
                        costs: [],
                        benefits: [],
                        roi_percentage: '',
                        payback_period: ''
                      },
                      risk_assessment: [''],
                      alternatives_considered: [''],
                      recommendation: '',
                      return_on_investment: ''
                    });
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                data-testid="cancel-business-case-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                data-testid="save-business-case-btn"
              >
                {saving ? 'Saving...' : (businessCase ? 'Update Business Case' : 'Create Business Case')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BusinessCase;