import React from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Calendar, Users, FileText, Bell } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { format, isToday, isTomorrow, addDays, isBefore } from 'date-fns';
import { Task } from '../types';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description?: string;
}

function StatsCard({ title, value, icon: Icon, color, bgColor, description }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

interface TaskPreviewProps {
  task: Task;
  onClick: () => void;
}

function TaskPreview({ task, onClick }: TaskPreviewProps) {
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
      case 'overdue': return 'text-red-600 dark:text-red-400';
      case 'in-progress': return 'text-blue-600 dark:text-blue-400';
      case 'complete': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getDueDateText = (dueDate: Date) => {
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    if (isBefore(dueDate, new Date())) return 'Overdue';
    return format(dueDate, 'MMM d');
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{task.heading}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
          
          <div className="flex items-center space-x-3 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`font-medium ${getStatusColor(task.status)}`}>
              {getDueDateText(task.dueDate)}
            </span>
            {task.peopleInvolved.length > 0 && (
              <span className="text-gray-500 dark:text-gray-400 flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {task.peopleInvolved.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DashboardProps {
  onNewTask?: () => void;
  onViewChange?: (view: string) => void;
}

export function Dashboard({ onNewTask, onViewChange }: DashboardProps) {
  const { allTasks, getTaskStats } = useTasks();
  const stats = getTaskStats();

  const overdueTasks = allTasks.filter(task => task.status === 'overdue');
  const upcomingTasks = allTasks
    .filter(task => task.status === 'in-progress' && isBefore(task.dueDate, addDays(new Date(), 7)))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  const recentTasks = allTasks
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-task':
        if (onNewTask) {
          onNewTask();
        }
        break;
      case 'reports':
        if (onViewChange) {
          onViewChange('reports');
        }
        break;
      case 'team':
        if (onViewChange) {
          onViewChange('team');
        }
        break;
      case 'schedule-review':
        if (onViewChange) {
          onViewChange('calendar');
        }
        break;
      default:
        console.log(`Action ${action} not implemented yet`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Compliance Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          Stay on top of your regulatory requirements and deadlines
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tasks"
          value={stats.total}
          icon={FileText}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-900/50"
          description="Active compliance items"
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-50 dark:bg-red-900/50"
          description="Require immediate attention"
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-50 dark:bg-yellow-900/50"
          description="Currently being worked on"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-50 dark:bg-green-900/50"
          description="Successfully finished"
        />
      </div>

      {/* Alerts Section */}
      {(overdueTasks.length > 0 || stats.upcomingDueSoon > 0) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Attention Required</h3>
          </div>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            {overdueTasks.length > 0 && (
              <p className="mb-1">• {overdueTasks.length} task(s) are overdue</p>
            )}
            {stats.upcomingDueSoon > 0 && (
              <p>• {stats.upcomingDueSoon} task(s) due within the next 7 days</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Upcoming Deadlines
            </h2>
          </div>
          <div className="p-6">
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map(task => (
                  <TaskPreview key={task.id} task={task} onClick={() => {}} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines in the next 7 days</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map(task => (
                  <TaskPreview key={task.id} task={task} onClick={() => {}} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('new-task')}
            className="flex items-center justify-center px-4 py-3 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/70 transition-colors duration-200"
          >
            <FileText className="h-5 w-5 mr-2" />
            New Task
          </button>
          <button 
            onClick={() => handleQuickAction('reports')}
            className="flex items-center justify-center px-4 py-3 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/70 transition-colors duration-200"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Generate Report
          </button>
          <button 
            onClick={() => handleQuickAction('team')}
            className="flex items-center justify-center px-4 py-3 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/70 transition-colors duration-200"
          >
            <Users className="h-5 w-5 mr-2" />
            Invite Team
          </button>
          <button 
            onClick={() => handleQuickAction('schedule-review')}
            className="flex items-center justify-center px-4 py-3 bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/70 transition-colors duration-200"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Schedule Review
          </button>
        </div>
      </div>
    </div>
  );
}