import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WorkBreakdownStructure = ({ projectId }) => {
  const { user } = useAuth();
  const [wbsTasks, setWbsTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null,
    level: 1,
    wbs_code: '',
    status: 'not_started',
    assigned_to: '',
    estimated_hours: 0,
    start_date: '',
    end_date: '',
    dependencies: [],
    deliverables: [],
    notes: ''
  });

  const statusOptions = [
    { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    if (projectId) {
      fetchWBSTasks();
    }
  }, [projectId]);

  const fetchWBSTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/wbs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const tasks = await response.json();
        setWbsTasks(tasks);
      } else {
        toast.error('Failed to fetch WBS tasks');
      }
    } catch (error) {
      console.error('Error fetching WBS tasks:', error);
      toast.error('Error loading WBS tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingTask 
        ? `/api/wbs/${editingTask.id}`
        : `/api/projects/${projectId}/wbs`;
      
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          project_id: projectId,
          estimated_hours: parseFloat(formData.estimated_hours) || 0,
          deliverables: formData.deliverables.filter(d => d.trim()),
          dependencies: formData.dependencies.filter(d => d.trim())
        })
      });

      if (response.ok) {
        toast.success(editingTask ? 'Task updated successfully' : 'Task created successfully');
        fetchWBSTasks();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Error saving task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/wbs/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        fetchWBSTasks();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_id: null,
      level: 1,
      wbs_code: '',
      status: 'not_started',
      assigned_to: '',
      estimated_hours: 0,
      start_date: '',
      end_date: '',
      dependencies: [],
      deliverables: [],
      notes: ''
    });
    setShowAddForm(false);
    setEditingTask(null);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      parent_id: task.parent_id,
      level: task.level,
      wbs_code: task.wbs_code,
      status: task.status,
      assigned_to: task.assigned_to || '',
      estimated_hours: task.estimated_hours || 0,
      start_date: task.start_date ? task.start_date.split('T')[0] : '',
      end_date: task.end_date ? task.end_date.split('T')[0] : '',
      dependencies: task.dependencies || [],
      deliverables: task.deliverables || [],
      notes: task.notes || ''
    });
    setShowAddForm(true);
  };

  const toggleExpanded = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusConfig?.label || status}
      </span>
    );
  };

  const buildTaskHierarchy = (tasks) => {
    const taskMap = {};
    const rootTasks = [];

    // Create a map of all tasks
    tasks.forEach(task => {
      taskMap[task.id] = { ...task, children: [] };
    });

    // Build hierarchy
    tasks.forEach(task => {
      if (task.parent_id && taskMap[task.parent_id]) {
        taskMap[task.parent_id].children.push(taskMap[task.id]);
      } else {
        rootTasks.push(taskMap[task.id]);
      }
    });

    return rootTasks;
  };

  const renderTask = (task, depth = 0) => {
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = expandedTasks.has(task.id);

    return (
      <div key={task.id} className="border-b border-gray-200">
        <div className={`flex items-center py-3 px-4 hover:bg-gray-50 ${depth > 0 ? 'ml-' + (depth * 6) : ''}`}>
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(task.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">{task.wbs_code}</span>
                <h4 className="text-sm font-medium text-gray-900 truncate">{task.name}</h4>
                {getStatusBadge(task.status)}
              </div>
              
              {task.description && (
                <p className="mt-1 text-sm text-gray-500 truncate">{task.description}</p>
              )}
              
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                {task.estimated_hours > 0 && (
                  <div className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {task.estimated_hours}h
                  </div>
                )}
                
                {task.assigned_to && (
                  <div className="flex items-center">
                    <UserIcon className="h-3 w-3 mr-1" />
                    {task.assigned_to}
                  </div>
                )}
                
                {task.end_date && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {new Date(task.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(task)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(task.id)}
              className="p-1 text-gray-400 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {task.children.map(child => renderTask(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hierarchicalTasks = buildTaskHierarchy(wbsTasks);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Breakdown Structure</h2>
          <p className="mt-1 text-sm text-gray-500">
            Organize project work into manageable tasks and subtasks
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Task Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">WBS Code *</label>
                <input
                  type="text"
                  required
                  value={formData.wbs_code}
                  onChange={(e) => setFormData({...formData, wbs_code: e.target.value})}
                  placeholder="e.g., 1.1.2"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Level</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To</label>
              <input
                type="text"
                value={formData.assigned_to}
                onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-white shadow rounded-lg">
        {hierarchicalTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No WBS tasks yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first work breakdown structure task.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Task
            </button>
          </div>
        ) : (
          <div>
            {hierarchicalTasks.map(task => renderTask(task))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkBreakdownStructure;