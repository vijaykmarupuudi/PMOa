import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import TemplateSelector from './TemplateSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StakeholderRegister = () => {
  const { id: projectId } = useParams();
  const { user, token } = useAuth();
  const [stakeholders, setStakeholders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: projectId,
    name: '',
    title: '',
    organization: '',
    contact_email: '',
    contact_phone: '',
    role_in_project: '',
    influence_level: 'medium',
    interest_level: 'medium',
    communication_preference: 'email',
    expectations: [''],
    concerns: ['']
  });

  useEffect(() => {
    fetchStakeholders();
  }, [projectId]);

  const fetchStakeholders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/stakeholders/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStakeholders(data);
      }
    } catch (error) {
      console.error('Error fetching stakeholders:', error);
      toast.error('Failed to load stakeholders');
    }
    setLoading(false);
  };

  const handleTemplateApplied = (result) => {
    // Refresh stakeholders data after template is applied
    fetchStakeholders();
    toast.success('Template applied! Stakeholders have been added.');
  };

  const resetForm = () => {
    setFormData({
      project_id: projectId,
      name: '',
      title: '',
      organization: '',
      contact_email: '',
      contact_phone: '',
      role_in_project: '',
      influence_level: 'medium',
      interest_level: 'medium',
      communication_preference: 'email',
      expectations: [''],
      concerns: ['']
    });
    setEditingId(null);
    setShowForm(false);
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

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `${BACKEND_URL}/api/stakeholders/${editingId}`
        : `${BACKEND_URL}/api/stakeholders`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchStakeholders();
        resetForm();
        toast.success(editingId ? 'Stakeholder updated successfully!' : 'Stakeholder added successfully!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save stakeholder');
      }
    } catch (error) {
      console.error('Error saving stakeholder:', error);
      toast.error('Failed to save stakeholder');
    }
  };

  const handleEdit = (stakeholder) => {
    setFormData(stakeholder);
    setEditingId(stakeholder.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stakeholder?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/stakeholders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchStakeholders();
        toast.success('Stakeholder deleted successfully!');
      } else {
        toast.error('Failed to delete stakeholder');
      }
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      toast.error('Failed to delete stakeholder');
    }
  };

  const handleTemplateApplied = (result) => {
    // Refresh stakeholders after template is applied
    fetchStakeholders();
    toast.success('Template applied! Sample stakeholders have been added to your project.');
  };

  const getInfluenceColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterestColor = (level) => {
    switch (level) {
      case 'high': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-purple-100 text-purple-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Stakeholder Register</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage project stakeholders and their information
            </p>
          </div>
          <div className="flex space-x-3">
            {stakeholders.length === 0 && (
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                data-testid="use-stakeholder-template-btn"
              >
                📋 Use Template
              </button>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              data-testid="add-stakeholder-btn"
            >
              {showForm ? 'Cancel' : 'Add Stakeholder'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 py-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingId ? 'Edit Stakeholder' : 'Add New Stakeholder'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  data-testid="stakeholder-name-input"
                />
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  data-testid="stakeholder-title-input"
                />
              </div>
              
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization *
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  data-testid="stakeholder-organization-input"
                />
              </div>
              
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  data-testid="stakeholder-email-input"
                />
              </div>
              
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid="stakeholder-phone-input"
                />
              </div>
              
              <div>
                <label htmlFor="role_in_project" className="block text-sm font-medium text-gray-700 mb-1">
                  Role in Project *
                </label>
                <input
                  type="text"
                  id="role_in_project"
                  name="role_in_project"
                  value={formData.role_in_project}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  data-testid="stakeholder-role-input"
                />
              </div>
              
              <div>
                <label htmlFor="influence_level" className="block text-sm font-medium text-gray-700 mb-1">
                  Influence Level
                </label>
                <select
                  id="influence_level"
                  name="influence_level"
                  value={formData.influence_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid="stakeholder-influence-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="interest_level" className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Level
                </label>
                <select
                  id="interest_level"
                  name="interest_level"
                  value={formData.interest_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid="stakeholder-interest-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="communication_preference" className="block text-sm font-medium text-gray-700 mb-1">
                  Communication Preference
                </label>
                <select
                  id="communication_preference"
                  name="communication_preference"
                  value={formData.communication_preference}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  data-testid="stakeholder-comm-select"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="meetings">Meetings</option>
                  <option value="reports">Reports</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expectations
                </label>
                {formData.expectations.map((expectation, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={expectation}
                      onChange={(e) => handleArrayChange('expectations', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter expectation"
                      data-testid={`expectation-input-${index}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('expectations', index)}
                      className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                      data-testid={`remove-expectation-${index}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('expectations')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  data-testid="add-expectation"
                >
                  + Add Expectation
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concerns
                </label>
                {formData.concerns.map((concern, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={concern}
                      onChange={(e) => handleArrayChange('concerns', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter concern"
                      data-testid={`concern-input-${index}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('concerns', index)}
                      className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                      data-testid={`remove-concern-${index}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('concerns')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  data-testid="add-concern"
                >
                  + Add Concern
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                data-testid="cancel-stakeholder-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                data-testid="save-stakeholder-btn"
              >
                {editingId ? 'Update Stakeholder' : 'Add Stakeholder'}
              </button>
            </div>
          </form>
        )}

        <div className="px-6 py-6">
          {stakeholders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No stakeholders added yet.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800"
                data-testid="add-first-stakeholder-btn"
              >
                Add your first stakeholder
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" data-testid="stakeholders-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stakeholder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role & Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Influence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stakeholders.map((stakeholder) => (
                    <tr key={stakeholder.id} data-testid={`stakeholder-row-${stakeholder.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stakeholder.name}</div>
                        <div className="text-sm text-gray-500">{stakeholder.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stakeholder.role_in_project}</div>
                        <div className="text-sm text-gray-500">{stakeholder.organization}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stakeholder.contact_email}</div>
                        <div className="text-sm text-gray-500">
                          {stakeholder.contact_phone && `${stakeholder.contact_phone} • `}
                          {stakeholder.communication_preference}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInfluenceColor(stakeholder.influence_level)}`}>
                          {stakeholder.influence_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInterestColor(stakeholder.interest_level)}`}>
                          {stakeholder.interest_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(stakeholder)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          data-testid={`edit-stakeholder-${stakeholder.id}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(stakeholder.id)}
                          className="text-red-600 hover:text-red-900"
                          data-testid={`delete-stakeholder-${stakeholder.id}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        templateType="stakeholder_register"
        projectId={projectId}
        onTemplateApplied={handleTemplateApplied}
      />
    </div>
  );
};

export default StakeholderRegister;