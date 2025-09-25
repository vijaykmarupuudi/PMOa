import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PlayIcon,
  ChartBarIcon,
  FlagIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const ModuleNavigator = ({ project }) => {
  const navigate = useNavigate();

  const moduleConfig = {
    initiation: {
      name: 'Initiation',
      description: 'Project setup and documentation',
      icon: DocumentTextIcon,
      color: 'text-blue-600 bg-blue-50',
      available: true,
      path: '/initiation'
    },
    planning: {
      name: 'Planning',
      description: 'Work breakdown and resource planning',
      icon: ClipboardDocumentListIcon,
      color: 'text-yellow-600 bg-yellow-50',
      available: ['initiation', 'planning'].includes(project.status),
      path: `/planning/${project.id}`
    },
    execution: {
      name: 'Execution',
      description: 'Project implementation and delivery',
      icon: PlayIcon,
      color: 'text-green-600 bg-green-50',
      available: ['planning', 'execution'].includes(project.status),
      path: `/execution/${project.id}`
    },
    monitoring: {
      name: 'Monitoring',
      description: 'Performance tracking and control',
      icon: ChartBarIcon,
      color: 'text-purple-600 bg-purple-50',
      available: ['execution', 'monitoring', 'closure'].includes(project.status),
      path: `/monitoring/${project.id}`
    },
    closure: {
      name: 'Closure',
      description: 'Project completion and handover',
      icon: FlagIcon,
      color: 'text-gray-600 bg-gray-50',
      available: ['closure', 'completed'].includes(project.status),
      path: `/closure/${project.id}`
    }
  };

  const modules = Object.entries(moduleConfig);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">PMO Module Access</h3>
          <p className="text-sm text-gray-600">Navigate to available modules for this project</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {modules.map(([key, module]) => {
          const Icon = module.icon;
          const isCurrentModule = (
            (key === 'initiation' && project.status === 'initiation') ||
            (key === 'planning' && ['initiation', 'planning'].includes(project.status)) ||
            (key === 'execution' && ['planning', 'execution'].includes(project.status)) ||
            (key === 'monitoring' && ['execution', 'monitoring', 'closure'].includes(project.status)) ||
            (key === 'closure' && ['closure', 'completed'].includes(project.status))
          );

          return (
            <div
              key={key}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                module.available
                  ? 'cursor-pointer hover:shadow-md border-gray-200 hover:border-blue-300'
                  : 'cursor-not-allowed opacity-50 border-gray-100'
              } ${isCurrentModule ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              onClick={() => module.available && navigate(module.path)}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-full ${module.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div>
                  <h4 className={`text-sm font-medium ${
                    module.available ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {module.name}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    module.available ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {module.description}
                  </p>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-center">
                  {module.available ? (
                    <div className="flex items-center space-x-1">
                      {isCurrentModule && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-full">
                      Locked
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Access Notes */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Module Access Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Modules become available as your project progresses through different phases. 
                Complete the current phase to unlock the next module.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleNavigator;