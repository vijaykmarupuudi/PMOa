import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CommunicationPlan = ({ projectId }) => {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [formData, setFormData] = useState({
    stakeholder_group: '',
    information_type: '',
    method: 'email',
    frequency: 'weekly',
    responsible_person: '',
    audience: '',
    purpose: '',
    format: '',
    delivery_date: ''
  });

  const methodOptions = [
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'meeting', label: 'Meeting', icon: '🤝' },
    { value: 'report', label: 'Report', icon: '📊' },
    { value: 'dashboard', label: 'Dashboard', icon: '📈' },
    { value: 'phone', label: 'Phone Call', icon: '📞' },
    { value: 'chat', label: 'Chat/Slack', icon: '💬' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', color: 'bg-red-100 text-red-800' },
    { value: 'weekly', label: 'Weekly', color: 'bg-blue-100 text-blue-800' },
    { value: 'biweekly', label: 'Bi-weekly', color: 'bg-green-100 text-green-800' },
    { value: 'monthly', label: 'Monthly', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'quarterly', label: 'Quarterly', color: 'bg-purple-100 text-purple-800' },
    { value: 'as_needed', label: 'As Needed', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    if (projectId) {
      fetchCommunicationPlans();
    }
  }, [projectId]);

  const fetchCommunicationPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/communication-plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const plansData = await response.json();
        setPlans(plansData);
      }
    } catch (error) {
      console.error('Error fetching communication plans:', error);
      toast.error('Failed to load communication plans');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingPlan 
        ? `${BACKEND_URL}/api/projects/${projectId}/communication-plans/${editingPlan.id}`
        : `${BACKEND_URL}/api/projects/${projectId}/communication-plans`;
      
      const method = editingPlan ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        project_id: projectId,
        audience: formData.audience.split(',').map(item => item.trim()),
        delivery_date: formData.delivery_date || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editingPlan ? 'Communication plan updated!' : 'Communication plan created!');
        fetchCommunicationPlans();
        resetForm();
      } else {
        toast.error('Failed to save communication plan');
      }
    } catch (error) {
      console.error('Error saving communication plan:', error);
      toast.error('Failed to save communication plan');
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this communication plan?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/communication-plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Communication plan deleted!');
        fetchCommunicationPlans();
      } else {
        toast.error('Failed to delete communication plan');
      }
    } catch (error) {
      console.error('Error deleting communication plan:', error);
      toast.error('Failed to delete communication plan');
    }
  };

  const resetForm = () => {
    setFormData({
      stakeholder_group: '',
      information_type: '',
      method: 'email',
      frequency: 'weekly',
      responsible_person: '',
      audience: '',
      purpose: '',
      format: '',
      delivery_date: ''
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const editPlan = (plan) => {
    setFormData({
      stakeholder_group: plan.stakeholder_group,
      information_type: plan.information_type,
      method: plan.method,
      frequency: plan.frequency,
      responsible_person: plan.responsible_person,
      audience: Array.isArray(plan.audience) ? plan.audience.join(', ') : plan.audience,
      purpose: plan.purpose,
      format: plan.format || '',
      delivery_date: plan.delivery_date ? plan.delivery_date.split('T')[0] : ''
    });
    setEditingPlan(plan);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="communication-plan">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Communication Plan</h2>
          <p className="mt-1 text-sm text-gray-600">
            Define communication strategies and schedules for project stakeholders
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          data-testid="add-communication-plan-btn"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Communication Plan
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Total Plans</p>
              <p className="text-2xl font-bold text-blue-600">{plans.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Daily Communications</p>
              <p className="text-2xl font-bold text-green-600">
                {plans.filter(p => p.frequency === 'daily').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">Stakeholder Groups</p>
              <p className="text-2xl font-bold text-yellow-600">
                {new Set(plans.map(p => p.stakeholder_group)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900">Reports</p>
              <p className="text-2xl font-bold text-purple-600">
                {plans.filter(p => p.method === 'report').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Plans List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Communication Plans</h3>
        </div>
        
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No communication plans</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first communication plan.
            </p>
            <div className="mt-4">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Communication Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {plans.map((plan) => {
              const frequencyOption = frequencyOptions.find(f => f.value === plan.frequency);
              const methodOption = methodOptions.find(m => m.value === plan.method);
              
              return (
                <div key={plan.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">{plan.information_type}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${frequencyOption?.color}`}>
                          {frequencyOption?.label}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Stakeholder Group:</span> {plan.stakeholder_group}
                        </div>
                        <div>
                          <span className="font-medium">Method:</span> {methodOption?.icon} {methodOption?.label}
                        </div>
                        <div>
                          <span className="font-medium">Responsible:</span> {plan.responsible_person}
                        </div>
                        <div>
                          <span className="font-medium">Audience:</span> {Array.isArray(plan.audience) ? plan.audience.join(', ') : plan.audience}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Purpose:</span> {plan.purpose}
                      </div>
                      
                      {plan.format && (
                        <div className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Format:</span> {plan.format}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => editPlan(plan)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        data-testid={`edit-plan-${plan.id}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        data-testid={`delete-plan-${plan.id}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            
            <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPlan ? 'Edit Communication Plan' : 'Create New Communication Plan'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stakeholder Group *</label>
                    <input
                      type="text"
                      value={formData.stakeholder_group}
                      onChange={(e) => setFormData(prev => ({ ...prev, stakeholder_group: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Executive Team, Development Team"
                      required
                      data-testid="stakeholder-group-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Information Type *</label>
                    <input
                      type="text"
                      value={formData.information_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, information_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Status Report, Meeting Notes"
                      required
                      data-testid="information-type-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communication Method</label>
                    <select
                      value={formData.method}
                      onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      data-testid="method-select"
                    >
                      {methodOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      data-testid="frequency-select"
                    >
                      {frequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Person *</label>
                    <input
                      type="text"
                      value={formData.responsible_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsible_person: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Person responsible for communication"
                      required
                      data-testid="responsible-person-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      data-testid="delivery-date-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience (comma-separated) *</label>
                  <input
                    type="text"
                    value={formData.audience}
                    onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Project Team, Stakeholders, Management"
                    required
                    data-testid="audience-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Purpose and objectives of this communication"
                    rows={3}
                    required
                    data-testid="purpose-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <input
                    type="text"
                    value={formData.format}
                    onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Email template, Meeting agenda, Dashboard"
                    data-testid="format-input"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    data-testid="save-communication-plan-btn"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationPlan;