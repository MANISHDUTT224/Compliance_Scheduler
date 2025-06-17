import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import { Task, FilterType, SortType } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TableViewProps {
  onNewTask?: () => void;
}

interface TableHeaderProps {
  label: string;
  sortKey: SortType;
  currentSort: SortType;
  onSort: (key: SortType) => void;
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
        {isActive && (
          <ChevronUp className="h-4 w-4" />
        )}
        {!isActive && (
          <ChevronDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </th>
  );
}

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
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
          {format(task.dueDate, 'MMM d, yyyy')}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {format(task.dueDate, 'h:mm a')}
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
          <span className="text-sm text-gray-900 dark:text-gray-100">{task.peopleInvolved.length}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {task.category}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {format(task.updatedAt, 'MMM d')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function TableView({ onNewTask }: TableViewProps) {
  const { tasks, filter, setFilter, sortBy, setSortBy, searchTerm, setSearchTerm, deleteTask, loadTasks, isLoading, error } = useTasks();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Tasks' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Compliance Tasks Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 35);
    doc.text(`Total tasks: ${tasks.length}`, 20, 45);

    const tableData = tasks.map(task => [
      task.heading,
      format(task.dueDate, 'MMM d, yyyy'),
      task.priority,
      task.status.replace('-', ' '),
      task.category,
      task.peopleInvolved.length.toString()
    ]);

    // @ts-ignore - jsPDF autotable types
    doc.autoTable({
      head: [['Task', 'Due Date', 'Priority', 'Status', 'Category', 'People']],
      body: tableData,
      startY: 55,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255
      }
    });

    doc.save('compliance-tasks-report.pdf');
  };

  const handleEdit = (task: Task) => {
    // This would open a modal or navigate to edit view
    console.log('Edit task:', task);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await loadTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Task Table</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Detailed view of all compliance tasks
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onNewTask}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

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
              {filters.map(filterOption => (
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
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                      <span className="text-gray-500 dark:text-gray-400">Loading tasks...</span>
                    </div>
                  </td>
                </tr>
              ) : tasks.length > 0 ? (
                tasks.map(task => (
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
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
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
            Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''} 
            {filter !== 'all' && ` with status: ${filter.replace('-', ' ')}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
}