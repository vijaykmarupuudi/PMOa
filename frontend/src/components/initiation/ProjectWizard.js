import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProjectWizard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    project_name: '',
    project_type: 'standard',
    industry: '',
    complexity_level: 'medium',
    team_size: '',
    duration_estimate: '',
    budget_range: '',
    methodology: 'hybrid'
  });

  const steps = [
    { id: 1, name: 'Project Basics', description: 'Basic project information' },
    { id: 2, name: 'Project Details', description: 'Detailed project configuration' },
    { id: 3, name: 'Review & Create', description: 'Review and create project' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/project-wizard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const project = await response.json();
        toast.success('Project created successfully!');
        navigate(`/projects/${project.id}`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
    
    setLoading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="project_name"
                name="project_name"
                value={formData.project_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
                required
                data-testid="project-name-input"
              />
            </div>
            
            <div>
              <label htmlFor="project_type" className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <select
                id="project_type"
                name="project_type"
                value={formData.project_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                data-testid="project-type-select"
              >
                <option value="standard">Standard Project</option>
                <option value="agile">Agile Project</option>
                <option value="waterfall">Waterfall Project</option>
              </select>
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                data-testid="industry-select"
              >
                <option value="">Select Industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="complexity_level" className="block text-sm font-medium text-gray-700 mb-2">
                Complexity Level
              </label>
              <select
                id="complexity_level"
                name="complexity_level"
                value={formData.complexity_level}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                data-testid="complexity-select"
              >
                <option value="low">Low - Simple, well-defined project</option>
                <option value="medium">Medium - Some complexity and unknowns</option>
                <option value="high">High - Complex with many dependencies</option>
              </select>
            </div>

            <div>
              <label htmlFor="team_size" className="block text-sm font-medium text-gray-700 mb-2">
                Expected Team Size
              </label>
              <input
                type="number"
                id="team_size"
                name="team_size"
                value={formData.team_size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Number of team members"
                min="1"
                data-testid="team-size-input"
              />
            </div>

            <div>
              <label htmlFor="duration_estimate" className="block text-sm font-medium text-gray-700 mb-2">
                Duration Estimate
              </label>
              <select
                id="duration_estimate"
                name="duration_estimate"
                value={formData.duration_estimate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                data-testid="duration-select"
              >
                <option value="">Select Duration</option>
                <option value="1-3 months">1-3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="6-12 months">6-12 months</option>
                <option value="1+ year">1+ year</option>
              </select>
            </div>

            <div>
              <label htmlFor="budget_range" className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range
              </label>
              <select
                id="budget_range"
                name="budget_range"
                value={formData.budget_range}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                data-testid="budget-select"
              >
                <option value="">Select Budget Range</option>
                <option value="< $10K">Less than $10,000</option>
                <option value="$10K - $50K">$10,000 - $50,000</option>
                <option value="$50K - $100K">$50,000 - $100,000</option>
                <option value="$100K - $500K">$100,000 - $500,000</option>
                <option value="$500K+">$500,000+</option>
              </select>
            </div>

            <div>
              <label htmlFor="methodology" className="block text-sm font-medium text-gray-700 mb-2">
                Project Methodology
              </label>
              <select
                id="methodology"
                name="methodology"
                value={formData.methodology}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                data-testid="methodology-select"
              >
                <option value="agile">Agile</option>
                <option value="waterfall">Waterfall</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Your Project</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Project Name</dt>
                  <dd className="text-sm text-gray-900">{formData.project_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Project Type</dt>
                  <dd className="text-sm text-gray-900 capitalize">{formData.project_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Industry</dt>
                  <dd className="text-sm text-gray-900 capitalize">{formData.industry || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Complexity</dt>
                  <dd className="text-sm text-gray-900 capitalize">{formData.complexity_level}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Team Size</dt>
                  <dd className="text-sm text-gray-900">{formData.team_size || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="text-sm text-gray-900">{formData.duration_estimate || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Budget Range</dt>
                  <dd className="text-sm text-gray-900">{formData.budget_range || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Methodology</dt>
                  <dd className="text-sm text-gray-900 capitalize">{formData.methodology}</dd>
                </div>
              </dl>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Project Setup Wizard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new project with guided setup
          </p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li
                  key={step.id}
                  className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}
                >
                  <div className="flex items-center">
                    <div
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                        step.id <= currentStep
                          ? 'bg-blue-600 text-white'
                          : 'border-2 border-gray-300 text-gray-500'
                      }`}
                    >
                      <span className="text-sm font-medium">{step.id}</span>
                    </div>
                    <div className="ml-4 min-w-0">
                      <span
                        className={`text-sm font-medium ${
                          step.id <= currentStep ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 py-4 bg-gray-50 flex justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="wizard-prev-btn"
            >
              Previous
            </button>
            
            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.project_name}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="wizard-next-btn"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !formData.project_name}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="wizard-create-btn"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectWizard;