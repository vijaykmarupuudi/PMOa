import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectWizard from '../initiation/ProjectWizard';

export default function CreateProject() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the unified project wizard
    navigate('/initiation/wizard', { replace: true });
  }, [navigate]);

  // Render the wizard directly while redirecting
  return (
    <div className="space-y-6" data-testid="create-project-unified">
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Create New Project
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up a new project with our guided wizard
            </p>
          </div>
        </div>
      </div>
      
      <ProjectWizard />
    </div>
  );
}