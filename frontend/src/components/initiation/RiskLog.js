import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import TemplateSelector from './TemplateSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RiskLog = () => {
  const { id: projectId } = useParams();
  const { user, token } = useAuth();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: projectId,
    title: '',
    description: '',
    category: 'Technical',
    probability: 'medium',
    impact: 'medium',
    status: 'identified',
    owner: '',
    mitigation_strategy: '',
    contingency_plan: '',
    target_date: ''
  });

  const categories = ['Technical', 'Schedule', 'Budget', 'Resource', 'External', 'Organizational', 'Quality', 'Regulatory/Compliance'];
  const probabilityLevels = [
    { value: 'very_low', label: 'Very Low (0-10%)', score: 1 },
    { value: 'low', label: 'Low (11-30%)', score: 2 },
    { value: 'medium', label: 'Medium (31-50%)', score: 3 },
    { value: 'high', label: 'High (51-80%)', score: 4 },
    { value: 'very_high', label: 'Very High (81-100%)', score: 5 }
  ];
  const impactLevels = [
    { value: 'very_low', label: 'Very Low (Minimal)', score: 1 },
    { value: 'low', label: 'Low (Minor)', score: 2 },
    { value: 'medium', label: 'Medium (Moderate)', score: 3 },
    { value: 'high', label: 'High (Major)', score: 4 },
    { value: 'very_high', label: 'Very High (Severe)', score: 5 }
  ];
  const statusOptions = ['identified', 'assessed', 'mitigated', 'closed', 'occurred'];

  useEffect(() => {
    fetchRisks();
  }, [projectId]);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/risks/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRisks(data);
      } else if (response.status === 404) {
        setRisks([]);
      }
    } catch (error) {
      console.error('Error fetching risks:', error);
      setRisks([]);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateRiskScore = (probability, impact) => {
    const probScore = probabilityLevels.find(p => p.value === probability)?.score || 3;
    const impScore = impactLevels.find(i => i.value === impact)?.score || 3;
    return probScore * impScore;
  };

  const getRiskScoreColor = (score) => {
    if (score <= 6) return 'bg-green-100 text-green-800';
    if (score <= 12) return 'bg-yellow-100 text-yellow-800';
    if (score <= 20) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/risks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          target_date: formData.target_date || null
        })
      });

      if (response.ok) {
        toast.success('Risk added successfully!');
        fetchRisks();
        setShowCreateForm(false);
        setFormData({
          project_id: projectId,
          title: '',
          description: '',
          category: 'Technical',
          probability: 'medium',
          impact: 'medium',
          status: 'identified',
          owner: '',
          mitigation_strategy: '',
          contingency_plan: '',
          target_date: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save risk');
      }
    } catch (error) {
      console.error('Error saving risk:', error);
      toast.error('Failed to save risk');
    }
    
    setSaving(false);
  };

  const handleTemplateApplied = (result) => {
    fetchRisks();
    toast.success('Template applied! Sample risks have been added to your project.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Risk Log</h1>
            <p className="mt-1 text-sm text-gray-600">
              Identify, assess, and manage project risks
            </p>
          </div>
          <div className="flex space-x-3">
            {risks.length === 0 && (
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                data-testid="use-risk-template-btn"
              >
                📋 Use Template
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              data-testid="add-risk-btn"
            >
              + Add Risk
            </button>
          </div>
        </div>

        {/* Risk List */}
        <div className="px-6 py-6">
          {risks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No risks identified</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by identifying project risks or use a template.
              </p>
              <div className="mt-6 space-x-3">
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  📋 Use Template
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  data-testid="create-first-risk-btn"
                >
                  + Add Risk
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {risks.map((risk) => {
                    const score = calculateRiskScore(risk.probability, risk.impact);
                    return (
                      <tr key={risk.id} className="hover:bg-gray-50" data-testid={`risk-row-${risk.id}`}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                            <div className="text-sm text-gray-500">{risk.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {risk.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {probabilityLevels.find(p => p.value === risk.probability)?.label.split(' ')[0] || risk.probability}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {impactLevels.find(i => i.value === risk.impact)?.label.split(' ')[0] || risk.impact}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskScoreColor(score)}`}>
                            {score}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            risk.status === 'closed' ? 'bg-green-100 text-green-800' :
                            risk.status === 'mitigated' ? 'bg-blue-100 text-blue-800' :
                            risk.status === 'occurred' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {risk.owner || 'Unassigned'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Risk Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateForm(false)}></div>
            
            <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Risk</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter risk title"
                      required
                      data-testid="risk-title-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the risk in detail"
                      required
                      data-testid="risk-description-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="risk-category-select"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="probability" className="block text-sm font-medium text-gray-700 mb-2">
                        Probability
                      </label>
                      <select
                        id="probability"
                        name="probability"
                        value={formData.probability}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="risk-probability-select"
                      >
                        {probabilityLevels.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-2">
                        Impact
                      </label>
                      <select
                        id="impact"
                        name="impact"
                        value={formData.impact}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="risk-impact-select"
                      >
                        {impactLevels.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Owner
                      </label>
                      <input
                        type="text"
                        id="owner"
                        name="owner"
                        value={formData.owner}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Who is responsible for this risk?"
                        data-testid="risk-owner-input"
                      />
                    </div>

                    <div>
                      <label htmlFor="target_date" className="block text-sm font-medium text-gray-700 mb-2">
                        Target Resolution Date
                      </label>
                      <input
                        type="date"
                        id="target_date"
                        name="target_date"
                        value={formData.target_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="risk-target-date-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mitigation_strategy" className="block text-sm font-medium text-gray-700 mb-2">
                      Mitigation Strategy
                    </label>
                    <textarea
                      id="mitigation_strategy"
                      name="mitigation_strategy"
                      value={formData.mitigation_strategy}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="How will this risk be mitigated?"
                      data-testid="risk-mitigation-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="contingency_plan" className="block text-sm font-medium text-gray-700 mb-2">
                      Contingency Plan
                    </label>
                    <textarea
                      id="contingency_plan"
                      name="contingency_plan"
                      value={formData.contingency_plan}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="What will you do if this risk occurs?"
                      data-testid="risk-contingency-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    data-testid="save-risk-btn"
                  >
                    {saving ? 'Saving...' : 'Add Risk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        templateType="risk_log"
        projectId={projectId}
        onTemplateApplied={handleTemplateApplied}
      />
    </div>
  );
};

export default RiskLog;