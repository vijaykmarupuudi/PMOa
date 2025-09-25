import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  CalendarIcon,
  ClockIcon,
  FlagIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EnhancedTimelineGantt = ({ projectId }) => {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewRange, setViewRange] = useState('month');
  const [viewMode, setViewMode] = useState('gantt'); // gantt, resource, critical_path
  const [criticalPathAnalysis, setCriticalPathAnalysis] = useState(null);
  const [resourceUtilization, setResourceUtilization] = useState(null);
  
  const [taskFormData, setTaskFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    assigned_to: '',
    status: 'not_started',
    progress: 0,
    dependencies: [],
    priority: 'medium',
    estimated_hours: 0,
    task_type: 'task',
    is_critical_path: false,
    slack_time: 0,
    resources: [],
    constraints: []
  });

  const [milestoneFormData, setMilestoneFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    type: 'deliverable',
    status: 'pending',
    dependencies: [],
    deliverables: [],
    acceptance_criteria: []
  });

  const [resourceFormData, setResourceFormData] = useState({
    name: '',
    resource_type: 'human',
    description: '',
    cost_per_hour: 0,
    availability: 'available',
    capacity_hours_per_day: 8,
    skills: [],
    department: '',
    contact_info: ''
  });

  const statusOptions = [
    { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
  ];

  const taskTypeOptions = [
    { value: 'task', label: 'Regular Task', icon: CheckCircleIcon },
    { value: 'milestone_task', label: 'Milestone Task', icon: FlagIcon },
    { value: 'summary_task', label: 'Summary Task', icon: ChartBarIcon },
    { value: 'critical_path', label: 'Critical Path Task', icon: ExclamationTriangleIcon }
  ];

  const resourceTypeOptions = [
    { value: 'human', label: 'Human Resource', icon: UserGroupIcon },
    { value: 'equipment', label: 'Equipment', icon: CpuChipIcon },
    { value: 'material', label: 'Material', icon: CurrencyDollarIcon }
  ];

  useEffect(() => {
    fetchTimelineData();
    fetchCriticalPathAnalysis();
    fetchResourceUtilization();
  }, [projectId]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      const [tasksResponse, milestonesResponse, resourcesResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/projects/${projectId}/timeline/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BACKEND_URL}/api/projects/${projectId}/milestones`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BACKEND_URL}/api/projects/${projectId}/resources`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }

      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData);
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      toast.error('Failed to load timeline data');
    }
    setLoading(false);
  };

  const fetchCriticalPathAnalysis = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/critical-path`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCriticalPathAnalysis(data);
      }
    } catch (error) {
      console.error('Error fetching critical path analysis:', error);
    }
  };

  const fetchResourceUtilization = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/resource-utilization`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResourceUtilization(data);
      }
    } catch (error) {
      console.error('Error fetching resource utilization:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/timeline/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskFormData)
      });

      if (response.ok) {
        await fetchTimelineData();
        await fetchCriticalPathAnalysis();
        await fetchResourceUtilization();
        setShowTaskForm(false);
        setTaskFormData({
          name: '',
          description: '',
          start_date: '',
          end_date: '',
          assigned_to: '',
          status: 'not_started',
          progress: 0,
          dependencies: [],
          priority: 'medium',
          estimated_hours: 0,
          task_type: 'task',
          is_critical_path: false,
          slack_time: 0,
          resources: [],
          constraints: []
        });
        toast.success('Task created successfully');
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(milestoneFormData)
      });

      if (response.ok) {
        await fetchTimelineData();
        setShowMilestoneForm(false);
        setMilestoneFormData({
          name: '',
          description: '',
          due_date: '',
          type: 'deliverable',
          status: 'pending',
          dependencies: [],
          deliverables: [],
          acceptance_criteria: []
        });
        toast.success('Milestone created successfully');
      } else {
        toast.error('Failed to create milestone');
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error('Failed to create milestone');
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resourceFormData)
      });

      if (response.ok) {
        await fetchTimelineData();
        await fetchResourceUtilization();
        setShowResourceForm(false);
        setResourceFormData({
          name: '',
          resource_type: 'human',
          description: '',
          cost_per_hour: 0,
          availability: 'available',
          capacity_hours_per_day: 8,
          skills: [],
          department: '',
          contact_info: ''
        });
        toast.success('Resource created successfully');
      } else {
        toast.error('Failed to create resource');
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Failed to create resource');
    }
  };

  const updateTaskProgress = async (taskId, newProgress) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = {
        ...task,
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started'
      };

      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/timeline/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTask)
      });

      if (response.ok) {
        await fetchTimelineData();
        await fetchCriticalPathAnalysis();
        toast.success('Task progress updated');
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast.error('Failed to update task progress');
    }
  };

  const getTimelineRange = () => {
    if (tasks.length === 0 && milestones.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
      };
    }

    const allDates = [
      ...tasks.filter(t => t.start_date).map(t => new Date(t.start_date)),
      ...tasks.filter(t => t.end_date).map(t => new Date(t.end_date)),
      ...milestones.filter(m => m.due_date).map(m => new Date(m.due_date))
    ];

    if (allDates.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
      };
    }

    const earliestDate = new Date(Math.min(...allDates));
    const latestDate = new Date(Math.max(...allDates));
    
    // Add some padding
    const padding = 7; // days
    earliestDate.setDate(earliestDate.getDate() - padding);
    latestDate.setDate(latestDate.getDate() + padding);

    return { startDate: earliestDate, endDate: latestDate };
  };

  const generateTimelineColumns = () => {
    const { startDate, endDate } = getTimelineRange();
    const columns = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      if (viewRange === 'month') {
        columns.push({
          date: new Date(current),
          label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        current.setDate(current.getDate() + 1);
      } else if (viewRange === 'quarter') {
        columns.push({
          date: new Date(current),
          label: current.toLocaleDateString('en-US', { month: 'short' })
        });
        current.setMonth(current.getMonth() + 1);
      } else {
        columns.push({
          date: new Date(current),
          label: current.toLocaleDateString('en-US', { month: 'short' })
        });
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return columns;
  };

  const calculateTaskPosition = (task, totalDays) => {
    if (!task.start_date || !task.end_date) return null;
    
    const { startDate } = getTimelineRange();
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    
    const startOffset = Math.max(0, (taskStart - startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1);
    
    const leftPercentage = (startOffset / totalDays) * 100;
    const widthPercentage = (duration / totalDays) * 100;
    
    return { left: leftPercentage, width: Math.min(widthPercentage, 100 - leftPercentage) };
  };

  const calculateMilestonePosition = (milestone, totalDays) => {
    if (!milestone.due_date) return null;
    
    const { startDate } = getTimelineRange();
    const milestoneDate = new Date(milestone.due_date);
    
    const offset = Math.max(0, (milestoneDate - startDate) / (1000 * 60 * 60 * 24));
    const leftPercentage = (offset / totalDays) * 100;
    
    return leftPercentage <= 100 ? { left: leftPercentage } : null;
  };

  const getTaskStatusColor = (status, isCriticalPath = false) => {
    const colors = {
      'not_started': isCriticalPath ? 'bg-red-200' : 'bg-gray-200',
      'in_progress': isCriticalPath ? 'bg-orange-400' : 'bg-blue-400',
      'completed': isCriticalPath ? 'bg-green-500' : 'bg-green-400',
      'on_hold': isCriticalPath ? 'bg-yellow-500' : 'bg-yellow-300',
      'blocked': 'bg-red-500',
      'cancelled': 'bg-gray-400'
    };
    return colors[status] || 'bg-gray-300';
  };

  const getResourceAllocationColor = (allocation) => {
    if (allocation > 100) return 'bg-red-500'; // Overallocated
    if (allocation > 80) return 'bg-yellow-500'; // High utilization
    if (allocation > 50) return 'bg-blue-500'; // Moderate utilization
    return 'bg-green-500'; // Low utilization
  };

  const timelineColumns = generateTimelineColumns();
  const totalDays = timelineColumns.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="enhanced-timeline-gantt">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Enhanced Timeline & Gantt Chart</h2>
          <p className="mt-1 text-sm text-gray-600">
            Advanced project timeline with resource allocation, critical path analysis, and visual roadmaps
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Selector */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            data-testid="view-mode-selector"
          >
            <option value="gantt">Gantt Chart</option>
            <option value="resource">Resource View</option>
            <option value="critical_path">Critical Path</option>
          </select>
          
          {/* View Range Selector */}
          <select
            value={viewRange}
            onChange={(e) => setViewRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            data-testid="view-range-selector"
          >
            <option value="month">Monthly View</option>
            <option value="quarter">Quarterly View</option>
            <option value="year">Yearly View</option>
          </select>
          
          <button
            onClick={() => setShowResourceForm(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            data-testid="add-resource-btn"
          >
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Add Resource
          </button>
          
          <button
            onClick={() => setShowMilestoneForm(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            data-testid="add-milestone-btn"
          >
            <FlagIcon className="h-4 w-4 mr-2" />
            Add Milestone
          </button>
          
          <button
            onClick={() => setShowTaskForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            data-testid="add-task-btn"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Critical Path Analysis Summary */}
      {criticalPathAnalysis && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Critical Path Analysis</h3>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-yellow-700">Project Duration:</span>
              <span className="font-medium ml-1">{criticalPathAnalysis.project_duration} days</span>
            </div>
            <div>
              <span className="text-yellow-700">Critical Tasks:</span>
              <span className="font-medium ml-1">{criticalPathAnalysis.critical_path_tasks?.length || 0}</span>
            </div>
            <div>
              <span className="text-yellow-700">Start Date:</span>
              <span className="font-medium ml-1">
                {criticalPathAnalysis.earliest_start ? 
                  new Date(criticalPathAnalysis.earliest_start).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-yellow-700">End Date:</span>
              <span className="font-medium ml-1">
                {criticalPathAnalysis.latest_finish ? 
                  new Date(criticalPathAnalysis.latest_finish).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          {criticalPathAnalysis.recommendations && criticalPathAnalysis.recommendations.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-yellow-700 font-medium">Recommendations:</p>
              <ul className="text-sm text-yellow-600 mt-1">
                {criticalPathAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Resource Utilization Summary */}
      {resourceUtilization && viewMode === 'resource' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Resource Utilization Overview</h3>
            </div>
            <button
              onClick={() => fetchResourceUtilization()}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Resources:</span>
              <span className="font-medium ml-1">{resourceUtilization.summary?.total_resources || 0}</span>
            </div>
            <div>
              <span className="text-blue-700">Overallocated:</span>
              <span className="font-medium ml-1 text-red-600">{resourceUtilization.summary?.overallocated || 0}</span>
            </div>
            <div>
              <span className="text-blue-700">Total Cost:</span>
              <span className="font-medium ml-1">${(resourceUtilization.summary?.total_cost || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-blue-700">Status:</span>
              <span className={`font-medium ml-1 ${
                (resourceUtilization.summary?.overallocated || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {(resourceUtilization.summary?.overallocated || 0) > 0 ? 'Needs Attention' : 'Optimized'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Gantt Chart */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {viewMode === 'gantt' && 'Gantt Chart View'}
            {viewMode === 'resource' && 'Resource Allocation View'}
            {viewMode === 'critical_path' && 'Critical Path View'}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Timeline Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
              <div className="flex">
                <div className="w-80 px-4 py-3 border-r border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    {viewMode === 'resource' ? 'Resource' : 'Task'}
                  </span>
                </div>
                <div className="flex-1 grid grid-cols-30 gap-px bg-gray-200">
                  {timelineColumns.map((column, index) => (
                    <div key={index} className="bg-gray-50 px-1 py-3 text-center">
                      <span className="text-xs text-gray-600">{column.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="divide-y divide-gray-200">
              {viewMode === 'resource' ? (
                // Resource View
                resources.map((resource) => {
                  const resourceUtil = resourceUtilization?.resource_utilization?.[resource.name] || {};
                  return (
                    <div key={resource.id} className="flex hover:bg-gray-50">
                      <div className="w-80 px-4 py-4 border-r border-gray-200">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                            <div className="text-xs text-gray-500">{resource.resource_type}</div>
                            <div className="text-xs text-gray-500">
                              Utilization: {Math.round(resourceUtil.total_allocation || 0)}%
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getResourceAllocationColor(resourceUtil.total_allocation || 0)}`}></div>
                        </div>
                      </div>
                      <div className="flex-1 relative h-16 bg-white">
                        {/* Resource allocation bars */}
                        {(resourceUtil.tasks || []).map((task, taskIndex) => {
                          const taskObj = tasks.find(t => t.id === task.task_id);
                          if (!taskObj) return null;
                          const position = calculateTaskPosition(taskObj, totalDays);
                          if (!position) return null;
                          
                          return (
                            <div
                              key={taskIndex}
                              className={`absolute top-2 h-4 rounded ${getResourceAllocationColor(task.allocation)} opacity-70`}
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                                top: `${8 + taskIndex * 16}px`
                              }}
                              title={`${task.task_name} - ${task.allocation}%`}
                            >
                              <div className="text-xs text-white px-1 truncate">
                                {task.allocation}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Task View (Gantt or Critical Path)
                tasks.map((task) => {
                  const position = calculateTaskPosition(task, totalDays);
                  const isCriticalPath = criticalPathAnalysis?.critical_path_tasks?.includes(task.id);
                  const showTask = viewMode !== 'critical_path' || isCriticalPath;
                  
                  if (!showTask) return null;
                  
                  return (
                    <div key={task.id} className="flex hover:bg-gray-50">
                      <div className="w-80 px-4 py-4 border-r border-gray-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {isCriticalPath && <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />}
                            {task.task_type === 'critical_path' && <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />}
                            {task.status === 'completed' && <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />}
                            {task.status === 'in_progress' && <PlayIcon className="h-4 w-4 text-blue-500 mr-2" />}
                            {task.status === 'on_hold' && <PauseIcon className="h-4 w-4 text-yellow-500 mr-2" />}
                            {task.status === 'blocked' && <StopIcon className="h-4 w-4 text-red-500 mr-2" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{task.name}</div>
                            <div className="text-xs text-gray-500">{task.assigned_to}</div>
                            <div className="text-xs text-gray-500">
                              {task.estimated_hours}h • {task.priority} priority
                              {task.slack_time > 0 && ` • ${task.slack_time}d slack`}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {task.progress}%
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 relative h-16 bg-white">
                        {position && (
                          <div
                            className={`absolute top-4 h-6 rounded-md ${getTaskStatusColor(task.status, isCriticalPath)} 
                              ${isCriticalPath ? 'border-2 border-red-400' : 'border border-gray-300'}`}
                            style={{ left: `${position.left}%`, width: `${position.width}%` }}
                            title={`${task.name} - ${task.progress}% complete`}
                          >
                            <div className="flex items-center h-full px-2">
                              <div className="text-xs text-white font-medium truncate">
                                {task.name}
                              </div>
                              {/* Progress Bar */}
                              <div className="absolute bottom-0 left-0 h-1 bg-green-400 rounded-b-md"
                                   style={{ width: `${task.progress}%` }}>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Resource allocation indicators */}
                        {task.resources && task.resources.length > 0 && (
                          <div className="absolute top-11 left-2 flex space-x-1">
                            {task.resources.slice(0, 3).map((resource, idx) => (
                              <div
                                key={idx}
                                className="w-2 h-2 rounded-full bg-blue-400"
                                title={`${resource.resource_name} - ${resource.allocation_percentage}%`}
                              />
                            ))}
                            {task.resources.length > 3 && (
                              <div className="text-xs text-gray-500">+{task.resources.length - 3}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Milestones Row */}
              <div className="flex bg-gray-50">
                <div className="w-80 px-4 py-3 border-r border-gray-200">
                  <div className="flex items-center">
                    <FlagIcon className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Milestones</span>
                  </div>
                </div>
                <div className="flex-1 relative h-12 bg-gray-50">
                  {milestones.map((milestone) => {
                    const position = calculateMilestonePosition(milestone, totalDays);
                    if (!position) return null;
                    
                    return (
                      <div
                        key={milestone.id}
                        className="absolute top-2"
                        style={{ left: `${position.left}%` }}
                      >
                        <div className="relative">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-purple-500"></div>
                          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                            <div className="text-xs font-medium text-purple-700 bg-white px-1 rounded border">
                              {milestone.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <form onSubmit={handleCreateTask} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Create New Task</h3>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                  <input
                    type="text"
                    required
                    value={taskFormData.name}
                    onChange={(e) => setTaskFormData({...taskFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={taskFormData.assigned_to}
                    onChange={(e) => setTaskFormData({...taskFormData, assigned_to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={taskFormData.start_date}
                    onChange={(e) => setTaskFormData({...taskFormData, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={taskFormData.end_date}
                    onChange={(e) => setTaskFormData({...taskFormData, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taskFormData.estimated_hours}
                    onChange={(e) => setTaskFormData({...taskFormData, estimated_hours: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({...taskFormData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                  <select
                    value={taskFormData.task_type}
                    onChange={(e) => setTaskFormData({...taskFormData, task_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {taskTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_critical_path"
                    checked={taskFormData.is_critical_path}
                    onChange={(e) => setTaskFormData({...taskFormData, is_critical_path: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="is_critical_path" className="text-sm text-gray-700">Critical Path Task</label>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Form Modal */}
      {showResourceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <form onSubmit={handleCreateResource} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Add Resource</h3>
                <button
                  type="button"
                  onClick={() => setShowResourceForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
                  <input
                    type="text"
                    required
                    value={resourceFormData.name}
                    onChange={(e) => setResourceFormData({...resourceFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                  <select
                    value={resourceFormData.resource_type}
                    onChange={(e) => setResourceFormData({...resourceFormData, resource_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {resourceTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Hour</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={resourceFormData.cost_per_hour}
                      onChange={(e) => setResourceFormData({...resourceFormData, cost_per_hour: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hours per Day</label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={resourceFormData.capacity_hours_per_day}
                      onChange={(e) => setResourceFormData({...resourceFormData, capacity_hours_per_day: parseFloat(e.target.value) || 8})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={resourceFormData.department}
                    onChange={(e) => setResourceFormData({...resourceFormData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={resourceFormData.description}
                    onChange={(e) => setResourceFormData({...resourceFormData, description: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResourceForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Form Modal */}
      {showMilestoneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <form onSubmit={handleCreateMilestone} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Add Milestone</h3>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Name</label>
                  <input
                    type="text"
                    required
                    value={milestoneFormData.name}
                    onChange={(e) => setMilestoneFormData({...milestoneFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={milestoneFormData.due_date}
                      onChange={(e) => setMilestoneFormData({...milestoneFormData, due_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={milestoneFormData.type}
                      onChange={(e) => setMilestoneFormData({...milestoneFormData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="deliverable">Deliverable</option>
                      <option value="checkpoint">Checkpoint</option>
                      <option value="deadline">Deadline</option>
                      <option value="phase_gate">Phase Gate</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={milestoneFormData.description}
                    onChange={(e) => setMilestoneFormData({...milestoneFormData, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTimelineGantt;