import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

// Use the same backend URL logic as AuthContext
const getBackendURL = () => {
  if (process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL !== 'http://localhost:8001') {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  return 'http://localhost:8001';
};

const BACKEND_URL = getBackendURL();

const Templates = () => {
  const { user, token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchTemplates = React.useCallback(async () => {
    if (!token) {
      console.log('⚠️ No token available, skipping template fetch');
      return;
    }

    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/templates`;
      const params = new URLSearchParams();
      
      if (selectedType !== 'all') {
        params.append('template_type', selectedType);
      }
      if (selectedIndustry !== 'all') {
        params.append('industry', selectedIndustry);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('🔗 Fetching templates from:', url);
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Templates response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Templates data received:', data.length, 'templates');
        setTemplates(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Templates fetch error:', response.status, errorData);
        
        // Handle different error types properly
        let errorMessage = 'Failed to fetch templates';
        
        if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
          // Parse Pydantic validation errors
          const validationErrors = errorData.detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'field';
            return `${field}: ${err.msg}`;
          });
          errorMessage = validationErrors.join(', ');
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : 'Failed to fetch templates';
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      
      // Handle different error types properly
      let errorMessage = 'Error loading templates';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (error.response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'field';
            return `${field}: ${err.msg}`;
          });
          errorMessage = validationErrors.join(', ');
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : 'Error loading templates';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, selectedType, selectedIndustry]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleUseTemplate = async (templateId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/templates/${templateId}/use`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Template selected! You can now create your document.');
        // Here you would typically navigate to the creation form with template data
      } else {
        toast.error('Failed to use template');
      }
    } catch (error) {
      console.error('Error using template:', error);
      toast.error('Failed to use template');
    }
  };

  const previewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const getTemplateTypeLabel = (type) => {
    const labels = {
      'project_charter': 'Project Charter',
      'business_case': 'Business Case'
    };
    return labels[type] || type;
  };

  const getTemplateIcon = (type) => {
    if (type === 'project_charter') {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    }
  };

  return (
    <div className="space-y-6" data-testid="templates-page">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Templates Library
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Pre-built templates to accelerate your project documentation
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="template-type" className="block text-sm font-medium text-gray-700 mb-2">
              Template Type
            </label>
            <select
              id="template-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              data-testid="template-type-filter"
            >
              <option value="all">All Types</option>
              <option value="project_charter">Project Charter</option>
              <option value="business_case">Business Case</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              id="industry"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              data-testid="industry-filter"
            >
              <option value="all">All Industries</option>
              <option value="General">General</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Manufacturing">Manufacturing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
              data-testid={`template-card-${template.id}`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getTemplateIcon(template.template_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {template.name}
                    </h3>
                    {template.is_default && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getTemplateTypeLabel(template.template_type)}
                    </span>
                    {template.industry && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {template.industry}
                      </span>
                    )}
                    {template.project_type && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {template.project_type}
                      </span>
                    )}
                  </div>
                  
                  {template.usage_count > 0 && (
                    <p className="mt-2 text-xs text-gray-400">
                      Used {template.usage_count} time{template.usage_count !== 1 ? 's' : ''}
                    </p>
                  )}
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => previewTemplate(template)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      data-testid={`preview-template-${template.id}`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleUseTemplate(template.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      data-testid={`use-template-${template.id}`}
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or check back later.
          </p>
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowPreview(false)}></div>
            
            <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Template Preview: {selectedTemplate.name}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-500"
                  data-testid="close-preview-modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {JSON.stringify(selectedTemplate.template_data, null, 2)}
                </pre>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleUseTemplate(selectedTemplate.id);
                    setShowPreview(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  data-testid="use-template-from-preview"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;