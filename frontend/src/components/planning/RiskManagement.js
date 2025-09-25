import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RiskManagement = ({ projectId }) => {
  const { user } = useAuth();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    probability: 'medium',
    impact: 'medium',
    status: 'identified',
    owner: '',
    mitigation_strategy: '',
    contingency_plan: '',
    target_date: '',
    actual_date: ''
  });

  const probabilityOptions = [
    { value: 'very_low', label: 'Very Low (10%)', color: 'bg-green-100 text-green-800' },
    { value: 'low', label: 'Low (30%)', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium (50%)', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High (70%)', color: 'bg-orange-100 text-orange-800' },
    { value: 'very_high', label: 'Very High (90%)', color: 'bg-red-100 text-red-800' }
  ];

  const impactOptions = [
    { value: 'very_low', label: 'Very Low', color: 'bg-green-100 text-green-800' },
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'very_high', label: 'Very High', color: 'bg-red-100 text-red-800' }
  ];

  const statusOptions = [
    { value: 'identified', label: 'Identified', color: 'bg-gray-100 text-gray-800' },
    { value: 'assessed', label: 'Assessed', color: 'bg-blue-100 text-blue-800' },
    { value: 'mitigated', label: 'Mitigated', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
    { value: 'occurred', label: 'Occurred', color: 'bg-red-100 text-red-800' }
  ];

  const categoryOptions = [
    'Technical',
    'Schedule',
    'Budget',
    'Resource',
    'Quality',
    'Scope',
    'External',
    'Organizational',
    'Legal/Regulatory',
    'Market',
    'Other'
  ];

  useEffect(() => {
    if (projectId) {
      fetchRisks();
    }
  }, [projectId]);

  const fetchRisks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/risks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const riskData = await response.json();
        setRisks(riskData);
      } else {
        toast.error('Failed to fetch risks');
      }
    } catch (error) {
      console.error('Error fetching risks:', error);
      toast.error('Error loading risks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingRisk 
        ? `/api/risks/${editingRisk.id}`
        : `/api/projects/${projectId}/risks`;
      
      const method = editingRisk ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          project_id: projectId
        })
      });

      if (response.ok) {
        toast.success(editingRisk ? 'Risk updated successfully' : 'Risk created successfully');
        fetchRisks();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save risk');
      }
    } catch (error) {
      console.error('Error saving risk:', error);
      toast.error('Error saving risk');
    }
  };

  const handleDelete = async (riskId) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) return;

    try {
      const response = await fetch(`/api/risks/${riskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Risk deleted successfully');
        fetchRisks();
      } else {
        toast.error('Failed to delete risk');
      }
    } catch (error) {
      console.error('Error deleting risk:', error);
      toast.error('Error deleting risk');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      probability: 'medium',
      impact: 'medium',
      status: 'identified',
      owner: '',
      mitigation_strategy: '',
      contingency_plan: '',
      target_date: '',
      actual_date: ''
    });
    setShowAddForm(false);
    setEditingRisk(null);
  };

  const handleEdit = (risk) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description,
      category: risk.category,
      probability: risk.probability,
      impact: risk.impact,
      status: risk.status,
      owner: risk.owner || '',
      mitigation_strategy: risk.mitigation_strategy || '',
      contingency_plan: risk.contingency_plan || '',
      target_date: risk.target_date ? risk.target_date.split('T')[0] : '',
      actual_date: risk.actual_date ? risk.actual_date.split('T')[0] : ''
    });
    setShowAddForm(true);
  };

  const getRiskScoreColor = (score) => {
    if (score <= 5) return 'bg-green-100 text-green-800';
    if (score <= 10) return 'bg-yellow-100 text-yellow-800';
    if (score <= 15) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskScoreLabel = (score) => {
    if (score <= 5) return 'Low';
    if (score <= 10) return 'Medium';
    if (score <= 15) return 'High';
    return 'Critical';
  };

  const getBadge = (value, options) => {
    const option = options.find(o => o.value === value);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option?.color || 'bg-gray-100 text-gray-800'}`}>
        {option?.label || value}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Risk Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Identify, assess, and manage project risks
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Risk
        </button>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Risks</dt>
                  <dd className="text-lg font-medium text-gray-900">{risks.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Critical Risks</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {risks.filter(r => r.risk_score > 15).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Mitigated</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {risks.filter(r => r.status === 'mitigated').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Open</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {risks.filter(r => ['identified', 'assessed'].includes(r.status)).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingRisk ? 'Edit Risk' : 'Add New Risk'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Risk Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Probability</label>
                <select
                  value={formData.probability}
                  onChange={(e) => setFormData({...formData, probability: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {probabilityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Impact</label>
                <select
                  value={formData.impact}
                  onChange={(e) => setFormData({...formData, impact: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {impactOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Risk Owner</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({...formData, owner: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mitigation Strategy</label>
              <textarea
                value={formData.mitigation_strategy}
                onChange={(e) => setFormData({...formData, mitigation_strategy: e.target.value})}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contingency Plan</label>
              <textarea
                value={formData.contingency_plan}
                onChange={(e) => setFormData({...formData, contingency_plan: e.target.value})}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Date</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Date</label>
                <input
                  type="date"
                  value={formData.actual_date}
                  onChange={(e) => setFormData({...formData, actual_date: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingRisk ? 'Update Risk' : 'Create Risk'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Risks List */}
      <div className="bg-white shadow rounded-lg">
        {risks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No risks identified yet</h3>
            <p className="text-gray-500 mb-4">Start by identifying potential project risks.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Risk
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {risks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{risk.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {risk.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskScoreColor(risk.risk_score)}`}>
                        {risk.risk_score} - {getRiskScoreLabel(risk.risk_score)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getBadge(risk.status, statusOptions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {risk.owner || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(risk)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(risk.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskManagement;