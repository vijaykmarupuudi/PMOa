import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WorkBreakdownStructure from './WorkBreakdownStructure';
import RiskManagement from './RiskManagement';
import BudgetPlanning from './BudgetPlanning';
import TimelineGantt from './TimelineGantt';
import { 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Planning = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('wbs');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    {
      id: 'wbs',
      name: 'Work Breakdown Structure',
      icon: ClipboardDocumentListIcon,
      component: WorkBreakdownStructure,
      description: 'Organize project work into manageable tasks'
    },
    {
      id: 'risks',
      name: 'Risk Management',
      icon: ExclamationTriangleIcon,
      component: RiskManagement,
      description: 'Identify and manage project risks'
    },
    {
      id: 'budget',
      name: 'Budget Planning',
      icon: CurrencyDollarIcon,
      component: BudgetPlanning,
      description: 'Plan and track project budget'
    },
    {
      id: 'timeline',
      name: 'Timeline & Gantt',
      icon: CalendarDaysIcon,
      component: TimelineGantt,
      description: 'Visual project timeline and dependencies'
    },
    {
      id: 'communication',
      name: 'Communication Plan',
      icon: ChatBubbleLeftRightIcon,
      component: () => <ComingSoonPlaceholder feature="Communication Plan" />,
      description: 'Stakeholder communication planning'
    },
    {
      id: 'quality',
      name: 'Quality & Procurement',
      icon: DocumentTextIcon,
      component: () => <ComingSoonPlaceholder feature="Quality & Procurement Templates" />,
      description: 'Quality assurance and procurement planning'
    }
  ];

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      } else if (response.status === 404) {
        toast.error('Project not found');
        navigate('/projects');
      } else {
        toast.error('Failed to fetch project details');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Error loading project');
    } finally {
      setLoading(false);
    }
  };

  const ComingSoonPlaceholder = ({ feature }) => (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{feature} - Coming Soon</h3>
      <p className="text-gray-500 mb-4">This feature is planned for future implementation.</p>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 max-w-md mx-auto">
        <p className="text-sm text-blue-700">
          <strong>Module 2 Progress:</strong> Work Breakdown Structure, Risk Management, and Budget Planning are now available. 
          Additional planning features will be added in upcoming releases.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <p className="text-gray-500 mb-4">The requested project could not be found.</p>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Planning Phase - Module 2</p>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Status</div>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {project.status?.replace('_', ' ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Priority</div>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {project.priority}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Description */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {ActiveComponent && <ActiveComponent projectId={projectId} />}
        </div>
      </div>

      {/* Planning Progress Indicator */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Planning Module Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Work Breakdown Structure</p>
              <p className="text-xs text-green-600">✅ Available</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Risk Management</p>
              <p className="text-xs text-green-600">✅ Available</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Budget Planning</p>
              <p className="text-xs text-green-600">✅ Available</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CalendarDaysIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Timeline & Gantt</p>
              <p className="text-xs text-green-600">✅ Available</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Module 2 Completion:</span>
            <span className="font-medium text-blue-600">67% Complete (4 of 6 features)</span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planning;