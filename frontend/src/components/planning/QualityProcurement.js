import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const QualityProcurement = ({ projectId }) => {
  const { user, token } = useAuth();
  const [qualityRequirements, setQualityRequirements] = useState([]);
  const [procurementItems, setProcurementItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('quality');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [qualityFormData, setQualityFormData] = useState({
    requirement_name: '',
    description: '',
    standard: 'custom',
    acceptance_criteria: '',
    testing_approach: '',
    responsible_party: '',
    target_date: '',
    status: 'planned',
    priority: 'medium'
  });

  const [procurementFormData, setProcurementFormData] = useState({
    item_name: '',
    description: '',
    procurement_type: 'software',
    vendor: '',
    estimated_cost: 0,
    actual_cost: 0,
    quantity: 1,
    unit: 'each',
    required_date: '',
    status: 'planned',
    approval_required: true,
    approved_by: '',
    notes: ''
  });

  const qualityStandards = [
    { value: 'iso_9001', label: 'ISO 9001' },
    { value: 'six_sigma', label: 'Six Sigma' },
    { value: 'cmmi', label: 'CMMI' },
    { value: 'agile_testing', label: 'Agile Testing' },
    { value: 'custom', label: 'Custom Standard' }
  ];

  const procurementTypes = [
    { value: 'software', label: 'Software', icon: '💻' },
    { value: 'hardware', label: 'Hardware', icon: '🖥️' },
    { value: 'services', label: 'Services', icon: '🛠️' },
    { value: 'consulting', label: 'Consulting', icon: '👨‍💼' },
    { value: 'training', label: 'Training', icon: '🎓' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  const procurementStatuses = [
    { value: 'planned', label: 'Planned', color: 'bg-gray-100 text-gray-800' },
    { value: 'rfq_sent', label: 'RFQ Sent', color: 'bg-blue-100 text-blue-800' },
    { value: 'evaluation', label: 'Evaluation', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'ordered', label: 'Ordered', color: 'bg-purple-100 text-purple-800' },
    { value: 'received', label: 'Received', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' }
  ];

  const statusOptions = [
    { value: 'planned', label: 'Planned', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
    { value: 'critical', label: 'Critical', color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch quality requirements
      const qualityResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}/quality-requirements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (qualityResponse.ok) {
        const qualityData = await qualityResponse.json();
        setQualityRequirements(qualityData);
      }

      // Fetch procurement items
      const procurementResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}/procurement-items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (procurementResponse.ok) {
        const procurementData = await procurementResponse.json();
        setProcurementItems(procurementData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleQualitySubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingItem 
        ? `${BACKEND_URL}/api/projects/${projectId}/quality-requirements/${editingItem.id}`
        : `${BACKEND_URL}/api/projects/${projectId}/quality-requirements`;
      
      const method = editingItem ? 'PUT' : 'POST';
      const payload = {
        ...qualityFormData,
        project_id: projectId,
        acceptance_criteria: qualityFormData.acceptance_criteria.split('\n').filter(c => c.trim()),
        target_date: qualityFormData.target_date || null
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
        toast.success(editingItem ? 'Quality requirement updated!' : 'Quality requirement created!');
        fetchData();
        resetForm();
      } else {
        toast.error('Failed to save quality requirement');
      }
    } catch (error) {
      console.error('Error saving quality requirement:', error);
      toast.error('Failed to save quality requirement');
    }
  };

  const handleProcurementSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingItem 
        ? `${BACKEND_URL}/api/projects/${projectId}/procurement-items/${editingItem.id}`
        : `${BACKEND_URL}/api/projects/${projectId}/procurement-items`;
      
      const method = editingItem ? 'PUT' : 'POST';
      const payload = {
        ...procurementFormData,
        project_id: projectId,
        estimated_cost: parseFloat(procurementFormData.estimated_cost) || 0,
        actual_cost: parseFloat(procurementFormData.actual_cost) || 0,
        quantity: parseInt(procurementFormData.quantity) || 1,
        required_date: procurementFormData.required_date || null
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
        toast.success(editingItem ? 'Procurement item updated!' : 'Procurement item created!');
        fetchData();
        resetForm();
      } else {
        toast.error('Failed to save procurement item');
      }
    } catch (error) {
      console.error('Error saving procurement item:', error);
      toast.error('Failed to save procurement item');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const endpoint = type === 'quality' ? 'quality-requirements' : 'procurement-items';
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`${type === 'quality' ? 'Quality requirement' : 'Procurement item'} deleted!`);
        fetchData();
      } else {
        toast.error(`Failed to delete ${type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const resetForm = () => {
    setQualityFormData({
      requirement_name: '',
      description: '',
      standard: 'custom',
      acceptance_criteria: '',
      testing_approach: '',
      responsible_party: '',
      target_date: '',
      status: 'planned',
      priority: 'medium'
    });
    setProcurementFormData({
      item_name: '',
      description: '',
      procurement_type: 'software',
      vendor: '',
      estimated_cost: 0,
      actual_cost: 0,
      quantity: 1,
      unit: 'each',
      required_date: '',
      status: 'planned',
      approval_required: true,
      approved_by: '',
      notes: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const editQualityRequirement = (requirement) => {
    setQualityFormData({
      requirement_name: requirement.requirement_name,
      description: requirement.description,
      standard: requirement.standard,
      acceptance_criteria: Array.isArray(requirement.acceptance_criteria) 
        ? requirement.acceptance_criteria.join('\n') : requirement.acceptance_criteria,
      testing_approach: requirement.testing_approach,
      responsible_party: requirement.responsible_party,
      target_date: requirement.target_date ? requirement.target_date.split('T')[0] : '',
      status: requirement.status,
      priority: requirement.priority
    });
    setEditingItem(requirement);
    setActiveTab('quality');
    setShowForm(true);
  };

  const editProcurementItem = (item) => {
    setProcurementFormData({
      item_name: item.item_name,
      description: item.description,
      procurement_type: item.procurement_type,
      vendor: item.vendor || '',
      estimated_cost: item.estimated_cost || 0,
      actual_cost: item.actual_cost || 0,
      quantity: item.quantity || 1,
      unit: item.unit || 'each',
      required_date: item.required_date ? item.required_date.split('T')[0] : '',
      status: item.status,
      approval_required: item.approval_required,
      approved_by: item.approved_by || '',
      notes: item.notes || ''
    });
    setEditingItem(item);
    setActiveTab('procurement');
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalProcurementCost = procurementItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

  return (
    <div className="space-y-6" data-testid="quality-procurement">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quality & Procurement</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage quality requirements and procurement planning
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setActiveTab('quality');
              setShowForm(true);
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            Add Quality Requirement
          </button>
          <button
            onClick={() => {
              setActiveTab('procurement');
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Procurement Item
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Quality Requirements</p>
              <p className="text-2xl font-bold text-blue-600">{qualityRequirements.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Completed Requirements</p>
              <p className="text-2xl font-bold text-green-600">
                {qualityRequirements.filter(q => q.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <ShoppingCartIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900">Procurement Items</p>
              <p className="text-2xl font-bold text-purple-600">{procurementItems.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">Total Budget</p>
              <p className="text-2xl font-bold text-yellow-600">${totalProcurementCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('quality')}
            className={`${
              activeTab === 'quality'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <ShieldCheckIcon className="h-5 w-5" />
            <span>Quality Requirements</span>
          </button>
          <button
            onClick={() => setActiveTab('procurement')}
            className={`${
              activeTab === 'procurement'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <ShoppingCartIcon className="h-5 w-5" />
            <span>Procurement Items</span>
          </button>
        </nav>
      </div>

      {/* Quality Requirements Tab */}
      {activeTab === 'quality' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quality Requirements</h3>
          </div>
          
          {qualityRequirements.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No quality requirements</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first quality requirement.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {qualityRequirements.map((requirement) => {
                const statusOption = statusOptions.find(s => s.value === requirement.status);
                const priorityOption = priorityOptions.find(p => p.value === requirement.priority);
                
                return (
                  <div key={requirement.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium text-gray-900">{requirement.requirement_name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOption?.color}`}>
                            {statusOption?.label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityOption?.color}`}>
                            {priorityOption?.label}
                          </span>
                        </div>
                        
                        <p className="mt-2 text-gray-600">{requirement.description}</p>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Standard:</span> {qualityStandards.find(s => s.value === requirement.standard)?.label}
                          </div>
                          <div>
                            <span className="font-medium">Responsible Party:</span> {requirement.responsible_party}
                          </div>
                          {requirement.target_date && (
                            <div>
                              <span className="font-medium">Target Date:</span> {new Date(requirement.target_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        {requirement.acceptance_criteria && requirement.acceptance_criteria.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-sm text-gray-600">Acceptance Criteria:</span>
                            <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                              {(Array.isArray(requirement.acceptance_criteria) ? requirement.acceptance_criteria : [requirement.acceptance_criteria]).map((criteria, index) => (
                                <li key={index}>{criteria}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => editQualityRequirement(requirement)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          data-testid={`edit-quality-${requirement.id}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(requirement.id, 'quality')}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          data-testid={`delete-quality-${requirement.id}`}
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
      )}

      {/* Procurement Items Tab */}
      {activeTab === 'procurement' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Procurement Items</h3>
          </div>
          
          {procurementItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No procurement items</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first procurement item.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {procurementItems.map((item) => {
                const statusOption = procurementStatuses.find(s => s.value === item.status);
                const typeOption = procurementTypes.find(t => t.value === item.procurement_type);
                
                return (
                  <div key={item.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium text-gray-900">{item.item_name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOption?.color}`}>
                            {statusOption?.label}
                          </span>
                        </div>
                        
                        <p className="mt-2 text-gray-600">{item.description}</p>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Type:</span> {typeOption?.icon} {typeOption?.label}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {item.quantity} {item.unit}
                          </div>
                          <div>
                            <span className="font-medium">Estimated Cost:</span> ${item.estimated_cost?.toLocaleString()}
                          </div>
                          {item.vendor && (
                            <div>
                              <span className="font-medium">Vendor:</span> {item.vendor}
                            </div>
                          )}
                          {item.required_date && (
                            <div>
                              <span className="font-medium">Required Date:</span> {new Date(item.required_date).toLocaleDateString()}
                            </div>
                          )}
                          {item.approved_by && (
                            <div>
                              <span className="font-medium">Approved By:</span> {item.approved_by}
                            </div>
                          )}
                        </div>
                        
                        {item.notes && (
                          <div className="mt-3">
                            <span className="font-medium text-sm text-gray-600">Notes:</span>
                            <p className="mt-1 text-sm text-gray-600">{item.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => editProcurementItem(item)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          data-testid={`edit-procurement-${item.id}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, 'procurement')}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          data-testid={`delete-procurement-${item.id}`}
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
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            
            <div className="relative inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingItem 
                    ? `Edit ${activeTab === 'quality' ? 'Quality Requirement' : 'Procurement Item'}` 
                    : `Create New ${activeTab === 'quality' ? 'Quality Requirement' : 'Procurement Item'}`}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {activeTab === 'quality' ? (
                <form onSubmit={handleQualitySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Requirement Name *</label>
                      <input
                        type="text"
                        value={qualityFormData.requirement_name}
                        onChange={(e) => setQualityFormData(prev => ({ ...prev, requirement_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Performance Testing Standards"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
                      <select
                        value={qualityFormData.standard}
                        onChange={(e) => setQualityFormData(prev => ({ ...prev, standard: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {qualityStandards.map(standard => (
                          <option key={standard.value} value={standard.value}>{standard.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={qualityFormData.description}
                      onChange={(e) => setQualityFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the quality requirement"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acceptance Criteria (one per line)</label>
                    <textarea
                      value={qualityFormData.acceptance_criteria}
                      onChange={(e) => setQualityFormData(prev => ({ ...prev, acceptance_criteria: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="List acceptance criteria, one per line"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Testing Approach *</label>
                      <input
                        type="text"
                        value={qualityFormData.testing_approach}
                        onChange={(e) => setQualityFormData(prev => ({ ...prev, testing_approach: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="How will this be tested?"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Party *</label>
                      <input
                        type="text"
                        value={qualityFormData.responsible_party}
                        onChange={(e) => setQualityFormData(prev => ({ ...prev, responsible_party: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Who is responsible?"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={qualityFormData.status}
                        onChange={(e) => setQualityFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={qualityFormData.priority}
                        onChange={(e) => setQualityFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {priorityOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={qualityFormData.target_date}
                        onChange={(e) => setQualityFormData(prev => ({ ...prev, target_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
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
                    >
                      {editingItem ? 'Update Requirement' : 'Create Requirement'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleProcurementSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                      <input
                        type="text"
                        value={procurementFormData.item_name}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, item_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Development Tools License"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={procurementFormData.procurement_type}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, procurement_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {procurementTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={procurementFormData.description}
                      onChange={(e) => setProcurementFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the procurement item"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                      <input
                        type="text"
                        value={procurementFormData.vendor}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, vendor: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Vendor name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={procurementFormData.status}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {procurementStatuses.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={procurementFormData.quantity}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        type="text"
                        value={procurementFormData.unit}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., each, licenses"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={procurementFormData.estimated_cost}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={procurementFormData.actual_cost}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, actual_cost: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Required Date</label>
                      <input
                        type="date"
                        value={procurementFormData.required_date}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, required_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
                      <input
                        type="text"
                        value={procurementFormData.approved_by}
                        onChange={(e) => setProcurementFormData(prev => ({ ...prev, approved_by: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Approval authority"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={procurementFormData.notes}
                      onChange={(e) => setProcurementFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes or comments"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="approval_required"
                      checked={procurementFormData.approval_required}
                      onChange={(e) => setProcurementFormData(prev => ({ ...prev, approval_required: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="approval_required" className="ml-2 block text-sm text-gray-900">
                      Approval Required
                    </label>
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
                    >
                      {editingItem ? 'Update Item' : 'Create Item'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityProcurement;