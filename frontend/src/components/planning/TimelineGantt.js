import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  CalendarIcon,
  ClockIcon,
  ArrowRightIcon,
  FlagIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TimelineGantt = ({ projectId }) => {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [viewRange, setViewRange] = useState('month'); // month, quarter, year
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
    estimated_hours: 0
  });

  const [milestoneFormData, setMilestoneFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    type: 'deliverable', // deliverable, checkpoint, deadline
    status: 'pending'
  });

  const statusOptions = [
    { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
    { value: 'critical', label: 'Critical', color: 'bg-purple-100 text-purple-800' }
  ];

  const milestoneTypes = [
    { value: 'deliverable', label: 'Deliverable', icon: '📦' },
    { value: 'checkpoint', label: 'Checkpoint', icon: '🎯' },
    { value: 'deadline', label: 'Deadline', icon: '⏰' }
  ];

  useEffect(() => {
    if (projectId) {
      fetchTimelineData();
    }
  }, [projectId]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const tasksResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}/timeline/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      // Fetch milestones
      const milestonesResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}/timeline/milestones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      toast.error('Failed to load timeline data');
    }
    setLoading(false);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingTask 
        ? `${BACKEND_URL}/api/projects/${projectId}/timeline/tasks/${editingTask.id}`
        : `${BACKEND_URL}/api/projects/${projectId}/timeline/tasks`;
      
      const method = editingTask ? 'PUT' : 'POST';
      const payload = {
        ...taskFormData,
        project_id: projectId,
        start_date: taskFormData.start_date || null,
        end_date: taskFormData.end_date || null
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
        toast.success(editingTask ? 'Task updated!' : 'Task created!');
        fetchTimelineData();
        resetTaskForm();
      } else {
        toast.error('Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
  };

  const handleMilestoneSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingMilestone 
        ? `${BACKEND_URL}/api/projects/${projectId}/timeline/milestones/${editingMilestone.id}`
        : `${BACKEND_URL}/api/projects/${projectId}/timeline/milestones`;
      
      const method = editingMilestone ? 'PUT' : 'POST';
      const payload = {
        ...milestoneFormData,
        project_id: projectId
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
        toast.success(editingMilestone ? 'Milestone updated!' : 'Milestone created!');
        fetchTimelineData();
        resetMilestoneForm();
      } else {
        toast.error('Failed to save milestone');
      }
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast.error('Failed to save milestone');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/timeline/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Task deleted!');
        fetchTimelineData();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/timeline/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Milestone deleted!');
        fetchTimelineData();
      } else {
        toast.error('Failed to delete milestone');
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
    }
  };

  const resetTaskForm = () => {
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
      estimated_hours: 0
    });
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const resetMilestoneForm = () => {
    setMilestoneFormData({
      name: '',
      description: '',
      due_date: '',
      type: 'deliverable',
      status: 'pending'
    });
    setEditingMilestone(null);
    setShowMilestoneForm(false);
  };

  const editTask = (task) => {
    setTaskFormData({
      name: task.name,
      description: task.description || '',
      start_date: task.start_date ? task.start_date.split('T')[0] : '',
      end_date: task.end_date ? task.end_date.split('T')[0] : '',
      assigned_to: task.assigned_to || '',
      status: task.status,
      progress: task.progress || 0,
      dependencies: task.dependencies || [],
      priority: task.priority || 'medium',
      estimated_hours: task.estimated_hours || 0
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const editMilestone = (milestone) => {
    setMilestoneFormData({
      name: milestone.name,
      description: milestone.description || '',
      due_date: milestone.due_date ? milestone.due_date.split('T')[0] : '',
      type: milestone.type || 'deliverable',
      status: milestone.status || 'pending'
    });
    setEditingMilestone(milestone);
    setShowMilestoneForm(true);
  };

  // Gantt Chart Helper Functions
  const getTimelineRange = () => {
    const now = new Date();
    let startDate, endDate;
    
    if (viewRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    } else if (viewRange === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3 - 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
    } else { // year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 0);
    }
    
    return { startDate, endDate };
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
    <div className="space-y-6" data-testid="timeline-gantt">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Timeline & Gantt Chart</h2>
          <p className="mt-1 text-sm text-gray-600">
            Visual project timeline with tasks, dependencies, and milestones
          </p>
        </div>
        <div className="flex items-center space-x-3">
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

      {/* Timeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Total Tasks</p>
              <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <FlagIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900">Milestones</p>
              <p className="text-2xl font-bold text-purple-600">{milestones.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Gantt Chart</h3>
        </div>
        
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200">
              <div className="w-80 flex-shrink-0 px-6 py-3 bg-gray-50 font-medium text-gray-900">
                Task / Milestone
              </div>
              <div className="flex-1 flex">
                {timelineColumns.map((col, index) => (
                  <div
                    key={index}
                    className="flex-1 px-2 py-3 bg-gray-50 border-l border-gray-200 text-center text-xs font-medium text-gray-500"
                    style={{ minWidth: '40px' }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones Row */}
            <div className="flex border-b border-gray-200 bg-purple-25">
              <div className="w-80 flex-shrink-0 px-6 py-3 font-medium text-purple-900">
                🏁 Milestones
              </div>
              <div className="flex-1 relative py-3" style={{ minHeight: '40px' }}>
                {milestones.map((milestone) => {
                  const position = calculateMilestonePosition(milestone, totalDays);
                  if (!position) return null;
                  
                  return (
                    <div
                      key={milestone.id}
                      className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${position.left}%` }}
                      title={`${milestone.name} - ${new Date(milestone.due_date).toLocaleDateString()}`}
                    >
                      <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-purple-600"></div>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-purple-600 whitespace-nowrap">
                        {milestoneTypes.find(t => t.value === milestone.type)?.icon || '🎯'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tasks */}
            {tasks.map((task) => {
              const statusOption = statusOptions.find(s => s.value === task.status);
              const priorityOption = priorityOptions.find(p => p.value === task.priority);
              const position = calculateTaskPosition(task, totalDays);
              
              return (
                <div key={task.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                  <div className="w-80 flex-shrink-0 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusOption?.color}`}>
                            {statusOption?.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityOption?.color}`}>
                            {priorityOption?.label}
                          </span>
                        </div>
                        {task.progress > 0 && (
                          <div className="mt-1 text-xs text-gray-500">{task.progress}% complete</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => editTask(task)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          data-testid={`edit-task-${task.id}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          data-testid={`delete-task-${task.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative py-3" style={{ minHeight: '40px' }}>
                    {position && (
                      <div
                        className={`absolute top-1/2 transform -translate-y-1/2 h-6 rounded ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-blue-500' :
                          task.status === 'on_hold' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`,
                          minWidth: '20px'
                        }}
                        title={`${task.name}: ${task.start_date ? new Date(task.start_date).toLocaleDateString() : 'No start'} - ${task.end_date ? new Date(task.end_date).toLocaleDateString() : 'No end'}`}
                      >
                        <div className="h-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white truncate px-1">
                            {task.progress > 0 ? `${task.progress}%` : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {tasks.length === 0 && milestones.length === 0 && (
              <div className="flex items-center justify-center py-12 border-b border-gray-200">
                <div className="text-center">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No timeline data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating tasks and milestones.
                  </p>
                  <div className="mt-4 space-x-3">
                    <button
                      onClick={() => setShowTaskForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add Task
                    </button>
                    <button
                      onClick={() => setShowMilestoneForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Add Milestone
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetTaskForm}></div>
            
            <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button onClick={resetTaskForm} className="text-gray-400 hover:text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                    <input
                      type="text"
                      value={taskFormData.name}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter task name"
                      required
                      data-testid="task-name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Task description"
                      rows={3}
                      data-testid="task-description-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={taskFormData.start_date}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="task-start-date-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={taskFormData.end_date}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="task-end-date-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={taskFormData.status}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="task-status-select"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={taskFormData.priority}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="task-priority-select"
                      >
                        {priorityOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={taskFormData.progress}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="task-progress-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                      <input
                        type="text"
                        value={taskFormData.assigned_to}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Team member name"
                        data-testid="task-assigned-to-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={taskFormData.estimated_hours}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        data-testid="task-estimated-hours-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetTaskForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    data-testid="save-task-btn"
                  >
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Form Modal */}
      {showMilestoneForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetMilestoneForm}></div>
            
            <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
                </h3>
                <button onClick={resetMilestoneForm} className="text-gray-400 hover:text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleMilestoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Name *</label>
                  <input
                    type="text"
                    value={milestoneFormData.name}
                    onChange={(e) => setMilestoneFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter milestone name"
                    required
                    data-testid="milestone-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={milestoneFormData.description}
                    onChange={(e) => setMilestoneFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Milestone description"
                    rows={3}
                    data-testid="milestone-description-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={milestoneFormData.due_date}
                      onChange={(e) => setMilestoneFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                      data-testid="milestone-due-date-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={milestoneFormData.type}
                      onChange={(e) => setMilestoneFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      data-testid="milestone-type-select"
                    >
                      {milestoneTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetMilestoneForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    data-testid="save-milestone-btn"
                  >
                    {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineGantt;