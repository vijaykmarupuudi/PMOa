import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TemplateSelector = ({ 
  isOpen, 
  onClose, 
  templateType, 
  projectId, 
  onTemplateApplied 
}) => {
  const { token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (isOpen && templateType) {
      fetchTemplates();
    }
  }, [isOpen, templateType]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/templates?template_type=${templateType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error loading templates');
    }
    setLoading(false);
  };

  const applyTemplate = async (templateId) => {
    setApplying(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/apply-template/${templateId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Template applied successfully!');
        onTemplateApplied && onTemplateApplied(result);
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to apply template');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Error applying template');
    }
    setApplying(false);
  };

  const getTemplateIcon = (type) => {
    if (type === 'project_charter') {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (type === 'business_case') {
      return (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    } else if (type === 'stakeholder_register') {
      return (
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    } else if (type === 'risk_log') {
      return (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    } else if (type === 'feasibility_study') {
      return (
        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getTemplateTypeLabel = (type) => {
    const labels = {
      'project_charter': 'Project Charter',
      'business_case': 'Business Case',
      'stakeholder_register': 'Stakeholder Register',
      'risk_log': 'Risk Log',
      'feasibility_study': 'Feasibility Study'
    };
    return labels[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Select {getTemplateTypeLabel(templateType)} Template
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              data-testid="close-template-selector"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No templates available for {getTemplateTypeLabel(templateType)}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getTemplateIcon(template.template_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium text-gray-900">
                            {template.name}
                          </h4>
                          {template.is_default && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                        
                        <div className="mt-2 flex flex-wrap gap-2">
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
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => applyTemplate(template.id)}
                          disabled={applying}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          data-testid={`apply-template-${template.id}`}
                        >
                          {applying ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;