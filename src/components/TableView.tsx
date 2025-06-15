import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Edit,
  Trash2,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import { Task, FilterType, SortType } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { TaskForm } from './TaskForm';

interface TableHeaderProps {
  label: string;
  sortKey: SortType;
  currentSort: SortType;
  onSort: (sortKey: SortType) => void;
}

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function TableHeader({ label, sortKey, currentSort, onSort }: TableHeaderProps) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {isActive && <ChevronUp className="h-4 w-4" />}
        {!isActive && <ChevronDown className="h-4 w-4 opacity-50" />}
      </div>
    </th>
  );
}

function TaskRow({ task, onEdit, onDelete }: TaskRowProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-700 dark:text-green-300';
      case 'overdue': return 'text-red-700 dark:text-red-300';
      case 'in-progress': return 'text-blue-700 dark:text-blue-300';
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  // Safely handle date formatting
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM d, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'h:mm a');
    } catch (error) {
      console.error('Time formatting error:', error);
      return 'Invalid Time';
    }
  };

  const formatUpdatedDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM d');
    } catch (error) {
      console.error('Updated date formatting error:', error);
      return 'Invalid';
    }
  };

  return (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {getStatusIcon(task.status)}
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.heading}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{task.description}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {formatDate(task.dueDate)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatTime(task.dueDate)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace('-', ' ')}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {task.peopleInvolved?.length || 0}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {task.category}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {task.updatedAt ? formatUpdatedDate(task.updatedAt) : formatUpdatedDate(task.createdAt || new Date())}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Edit task"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function TableView() {
  const { 
    tasks, 
    filter, 
    setFilter, 
    sortBy, 
    setSortBy, 
    searchTerm, 
    setSearchTerm, 
    deleteTask,
    refreshTasks 
  } = useTasks();
  
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [previousTasksLength, setPreviousTasksLength] = useState(tasks.length);
  const [taskIds, setTaskIds] = useState<Set<string>>(new Set(tasks.map(task => task.id)));

  // Real-time task change detection and auto-refresh
  useEffect(() => {
    const currentTaskIds = new Set(tasks.map(task => task.id));
    const currentTasksLength = tasks.length;
    
    // Check if tasks have been added, removed, or modified
    const tasksChanged = 
      currentTasksLength !== previousTasksLength ||
      currentTaskIds.size !== taskIds.size ||
      !Array.from(currentTaskIds).every(id => taskIds.has(id)) ||
      !Array.from(taskIds).every(id => currentTaskIds.has(id));

    if (tasksChanged && (previousTasksLength > 0 || taskIds.size > 0)) {
      console.log('TableView: Task changes detected!');
      console.log('TableView: Previous count:', previousTasksLength, 'Current count:', currentTasksLength);
      console.log('TableView: Previous IDs:', Array.from(taskIds));
      console.log('TableView: Current IDs:', Array.from(currentTaskIds));
      
      setLastRefresh(new Date());
      
      // Trigger a refresh to ensure we have the latest data
      if (refreshTasks && autoRefreshEnabled) {
        console.log('TableView: Triggering refresh due to task changes');
        refreshTasks().catch(error => {
          console.error('TableView: Error refreshing after task change:', error);
        });
      }
    }
    
    // Update tracking state
    setPreviousTasksLength(currentTasksLength);
    setTaskIds(currentTaskIds);
  }, [tasks, previousTasksLength, taskIds, refreshTasks, autoRefreshEnabled]);

  // Continuous polling for real-time updates (every 5 seconds when active)
  useEffect(() => {
    if (!autoRefreshEnabled || !refreshTasks) return;

    const interval = setInterval(async () => {
      try {
        console.log('TableView: Polling for updates...');
        await refreshTasks();
        // Don't update lastRefresh here to avoid spam, let the task change detection handle it
      } catch (error) {
        console.error('TableView: Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshTasks]);

  // Initial load and cleanup
  useEffect(() => {
    console.log('TableView: Component mounted, performing initial refresh...');
    console.log('TableView: useTasks hook data:', { 
      tasksLength: tasks.length, 
      refreshTasksAvailable: !!refreshTasks,
      filter,
      sortBy,
      searchTerm 
    });
    
    if (refreshTasks) {
      refreshTasks().then(() => {
        setLastRefresh(new Date());
        console.log('TableView: Initial refresh completed');
      }).catch((error) => {
        console.error('TableView: Initial refresh failed:', error);
      });
    } else {
      console.warn('TableView: refreshTasks not available on mount');
    }

    // Initialize tracking state
    setPreviousTasksLength(tasks.length);
    setTaskIds(new Set(tasks.map(task => task.id)));
  }, [refreshTasks]); // Only depend on refreshTasks to avoid infinite loops

  // Debug logging
  useEffect(() => {
    console.log('TableView: Tasks updated:', tasks);
    console.log('TableView: Number of tasks:', tasks.length);
  }, [tasks]);

  // Refresh when component becomes visible (browser tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefreshEnabled && refreshTasks) {
        console.log('TableView: Tab became visible, refreshing tasks...');
        refreshTasks().then(() => {
          setLastRefresh(new Date());
        }).catch(error => {
          console.error('TableView: Visibility refresh error:', error);
        });
      }
    };

    const handleFocus = () => {
      if (autoRefreshEnabled && refreshTasks) {
        console.log('TableView: Window focused, refreshing tasks...');
        refreshTasks().then(() => {
          setLastRefresh(new Date());
        }).catch(error => {
          console.error('TableView: Focus refresh error:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoRefreshEnabled, refreshTasks]);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Tasks' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('TableView: Manual refresh triggered');
      console.log('TableView: refreshTasks function available:', !!refreshTasks);
      console.log('TableView: Current tasks count before refresh:', tasks.length);
      
      if (refreshTasks) {
        await refreshTasks();
        setLastRefresh(new Date());
        console.log('TableView: Refresh completed successfully');
      } else {
        console.warn('TableView: refreshTasks function not available');
        // Fallback: try to force a re-render by updating a state
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('TableView: Error refreshing tasks:', error);
      alert('Failed to refresh tasks. Please check the console for details.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    console.log('TableView: Auto-refresh toggled:', !autoRefreshEnabled);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Compliance Tasks Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 35);
      doc.text(`Total tasks: ${tasks.length}`, 20, 45);
      
      const tableData = tasks.map((task) => [
        task.heading,
        format(typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate, 'MMM d, yyyy'),
        task.priority,
        task.status.replace('-', ' '),
        task.category,
        (task.peopleInvolved?.length || 0).toString(),
      ]);
      
      // @ts-expect-error - jsPDF autotable types
      doc.autoTable({
        head: [['Task', 'Due Date', 'Priority', 'Status', 'Category', 'People']],
        body: tableData,
        startY: 55,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
        },
      });
      
      doc.save('compliance-tasks-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleEdit = (task: Task) => {
    console.log('TableView: Edit task:', task);
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        console.log('TableView: Task deleted successfully');
        // Force refresh after deletion
        if (refreshTasks) {
          await refreshTasks();
          setLastRefresh(new Date());
        }
      } catch (error) {
        console.error('TableView: Error deleting task:', error);
        alert('Error deleting task. Please try again.');
      }
    }
  };

  const handleNewTask = () => {
    console.log('TableView: Creating new task');
    setEditingTask(undefined);
    setShowTaskForm(true);
  };

  const closeTaskForm = async () => {
    console.log('TableView: Closing task form');
    setShowTaskForm(false);
    setEditingTask(undefined);
    // Force refresh after closing form
    if (refreshTasks) {
      try {
        await refreshTasks();
        setLastRefresh(new Date());
        console.log('TableView: Tasks refreshed after form close');
      } catch (error) {
        console.error('TableView: Error refreshing after form close:', error);
      }
    }
  };

  const formatLastRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return format(lastRefresh, 'h:mm a');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Task Table</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Detailed view of all compliance tasks ({tasks.length} total)
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Last updated: {formatLastRefresh()} • 
            <span className={`ml-1 ${autoRefreshEnabled ? 'text-green-600' : 'text-gray-400'}`}>
              Real-time updates {autoRefreshEnabled ? 'ON' : 'OFF'}
            </span>
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={toggleAutoRefresh}
            className={`inline-flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
              autoRefreshEnabled 
                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
            }`}
            title={`${autoRefreshEnabled ? 'Disable' : 'Enable'} real-time updates`}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefreshEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            Auto
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh tasks manually"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleNewTask}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </button>
          <button
            onClick={exportToPDF}
            disabled={tasks.length === 0}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filters.map((filterOption) => (
                <option key={filterOption.value} value={filterOption.value}>
                  {filterOption.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Debug Info:</h3>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Tasks count: {tasks.length} | Filter: {filter} | Search: "{searchTerm}" | Sort: {sortBy}
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Real-time updates: {autoRefreshEnabled ? 'Enabled' : 'Disabled'} | Last refresh: {lastRefresh.toLocaleTimeString()}
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            refreshTasks available: {refreshTasks ? 'Yes' : 'No'} | isRefreshing: {isRefreshing ? 'Yes' : 'No'}
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Previous tasks: {previousTasksLength} | Current tasks: {tasks.length} | Task IDs: {taskIds.size}
          </p>
          <button
            onClick={() => console.log('useTasks hook state:', { tasks, filter, sortBy, searchTerm, refreshTasks: !!refreshTasks })}
            className="mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs"
          >
            Log Hook State
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <TableHeader label="Task" sortKey="heading" currentSort={sortBy} onSort={setSortBy} />
                <TableHeader label="Due Date" sortKey="dueDate" currentSort={sortBy} onSort={setSortBy} />
                <TableHeader label="Priority" sortKey="priority" currentSort={sortBy} onSort={setSortBy} />
                <TableHeader label="Status" sortKey="status" currentSort={sortBy} onSort={setSortBy} />
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  People
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No tasks found</p>
                      <p className="text-sm">
                        {searchTerm || filter !== 'all' 
                          ? 'Try adjusting your search or filter criteria'
                          : 'Create your first task to get started'
                        }
                      </p>
                      {!searchTerm && filter === 'all' && (
                        <button
                          onClick={handleNewTask}
                          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Task
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {tasks.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}{' '}
            {filter !== 'all' && ` with status: ${filter.replace('-', ' ')}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      )}

      {/* TaskForm Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onClose={closeTaskForm}
        />
      )}
    </div>
  );
}