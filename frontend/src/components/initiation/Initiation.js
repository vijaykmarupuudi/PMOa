import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProjectWizard from './ProjectWizard';
import ProjectCharter from './ProjectCharter';
import BusinessCase from './BusinessCase';
import StakeholderRegister from './StakeholderRegister';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Initiation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter projects in initiation phase
        const initiationProjects = data.filter(p => p.status === 'initiation');
        setProjects(initiationProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    setLoading(false);
  };

  const handleProjectSelect = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    navigate(`/initiation/project/${projectId}/charter`);
  };

  // If we're in a project route, extract the project ID
  const pathParts = location.pathname.split('/');
  const isInProject = pathParts.includes('project');
  const currentProjectId = isInProject ? pathParts[pathParts.indexOf('project') + 1] : null;

  // Main initiation dashboard
  if (location.pathname === '/initiation' || location.pathname === '/initiation/') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Project Initiation</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage project initiation activities and documentation
            </p>
          </div>

          <div className="p-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div 
                onClick={() => navigate('/initiation/wizard')}
                className="bg-blue-50 border border-blue-200 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition-colors"
                data-testid="project-wizard-card"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Project Wizard</h3>
                    <p className="text-sm text-gray-600">Start a new project with guided setup</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Active Projects</h3>
                    <p className="text-sm text-gray-600">{projects.length} projects in initiation</p>
                  </div>
                </div>
              </div>

              <div 
                className="bg-purple-50 border border-purple-200 rounded-lg p-6 cursor-pointer hover:bg-purple-100 transition-colors duration-200"
                onClick={() => navigate('/templates')}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Templates</h3>
                    <p className="text-sm text-gray-600">Project charter & business case templates</p>
                  </div>
                  <div className="ml-auto">
                    <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects in Initiation */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Projects in Initiation Phase</h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects in initiation</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/initiation/wizard')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      data-testid="create-first-project-btn"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Project
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                      data-testid={`project-card-${project.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
                          <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              project.priority === 'high' ? 'bg-red-100 text-red-800' :
                              project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {project.priority} priority
                            </span>
                            
                            <div className="text-sm text-gray-500">
                              {project.completion_percentage}% complete
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we're in the wizard route
  if (location.pathname === '/initiation/wizard') {
    return <ProjectWizard />;
  }

  // If we're in a project-specific route
  if (isInProject && currentProjectId) {
    const currentProject = projects.find(p => p.id === currentProjectId);
    
    return (
      <div className="max-w-6xl mx-auto">
        {/* Project Navigation */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentProject ? currentProject.name : 'Project Initiation'}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Complete initiation activities for this project
                </p>
              </div>
              <button
                onClick={() => navigate('/initiation')}
                className="text-sm text-blue-600 hover:text-blue-800"
                data-testid="back-to-initiation-btn"
              >
                ← Back to Initiation
              </button>
            </div>
          </div>
          
          <div className="px-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <NavLink
                to={`/initiation/project/${currentProjectId}/charter`}
                className={({ isActive }) =>
                  `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive || location.pathname.includes('charter')
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
                data-testid="charter-tab"
              >
                Project Charter
              </NavLink>
              <NavLink
                to={`/initiation/project/${currentProjectId}/business-case`}
                className={({ isActive }) =>
                  `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive || location.pathname.includes('business-case')
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
                data-testid="business-case-tab"
              >
                Business Case
              </NavLink>
              <NavLink
                to={`/initiation/project/${currentProjectId}/stakeholders`}
                className={({ isActive }) =>
                  `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive || location.pathname.includes('stakeholders')
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
                data-testid="stakeholders-tab"
              >
                Stakeholder Register
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Project Content */}
        <Routes>
          <Route path="project/:id/charter" element={<ProjectCharter />} />
          <Route path="project/:id/business-case" element={<BusinessCase />} />
          <Route path="project/:id/stakeholders" element={<StakeholderRegister />} />
        </Routes>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Project Initiation</h1>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default Initiation;