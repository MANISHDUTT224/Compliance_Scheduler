import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Users, AlertTriangle, Grid, List, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfDay, endOfDay, addWeeks, subWeeks } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types';

interface CalendarViewProps {
  onNewTask?: (date?: Date) => void;
}

type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarDayProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onDateClick: (date: Date) => void;
  onNewTask?: (date: Date) => void;
  viewType: CalendarViewType;
}

function CalendarDay({ date, tasks, isCurrentMonth, isToday, isSelected, onDateClick, onNewTask, viewType }: CalendarDayProps) {
  const overdueTasks = tasks.filter(task => task.status === 'overdue');
  const completeTasks = tasks.filter(task => task.status === 'complete');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');

  const handleDoubleClick = () => {
    if (onNewTask) {
      onNewTask(date);
    }
  };

  const getHeightClass = () => {
    switch (viewType) {
      case 'day': return 'min-h-[200px]';
      case 'week': return 'min-h-[120px]';
      case 'month': return 'min-h-[100px]';
      default: return 'min-h-[100px]';
    }
  };

  return (
    <div
      onClick={() => onDateClick(date)}
      onDoubleClick={handleDoubleClick}
      className={`${getHeightClass()} p-2 border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors duration-200 ${
        isCurrentMonth 
          ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
          : 'bg-gray-50 dark:bg-gray-900 text-gray-400'
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      title="Double-click to create new task"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${
          isToday 
            ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
            : isCurrentMonth 
              ? 'text-gray-900 dark:text-gray-100' 
              : 'text-gray-400'
        }`}>
          {format(date, viewType === 'month' ? 'd' : 'EEE d')}
        </span>
        {tasks.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        {tasks.slice(0, viewType === 'day' ? 10 : viewType === 'week' ? 4 : 3).map(task => (
          <div
            key={task.id}
            className={`text-xs p-1 rounded truncate ${
              task.status === 'overdue' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' 
                : task.status === 'complete'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
            }`}
          >
            {viewType === 'day' && (
              <div className="flex items-center space-x-1 mb-1">
                <span className="font-medium">{format(task.dueDate, 'HH:mm')}</span>
                <span className={`px-1 rounded text-xs ${
                  task.priority === 'critical' ? 'bg-red-200 text-red-800' :
                  task.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                  task.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-green-200 text-green-800'
                }`}>
                  {task.priority}
                </span>
              </div>
            )}
            <div className={viewType === 'day' ? 'font-medium' : ''}>{task.heading}</div>
            {viewType === 'day' && (
              <div className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</div>
            )}
          </div>
        ))}
        {tasks.length > (viewType === 'day' ? 10 : viewType === 'week' ? 4 : 3) && (
          <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
            +{tasks.length - (viewType === 'day' ? 10 : viewType === 'week' ? 4 : 3)} more
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

function TaskDetail({ task, onClose }: TaskDetailProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'complete':
        return <Clock className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{task.heading}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
              
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Notes</h3>
              <p className="text-gray-600 dark:text-gray-400">{task.notes || 'No notes added'}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Due Date:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(task.dueDate, 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
                    <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(task.status)}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {task.category}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">People Involved</h3>
                <div className="space-y-1">
                  {task.peopleInvolved.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{email}</span>
                    </div>
                  ))}
                  {task.peopleInvolved.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No people assigned</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Reminders</h3>
                <div className="space-y-1">
                  {task.reminders.map(reminder => (
                    <div key={reminder.id} className="text-sm text-gray-600 dark:text-gray-400">
                      {reminder.timing} days before due date
                      {reminder.sent && (
                        <span className="ml-2 text-green-600 dark:text-green-400">✓ Sent</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ onNewTask }: CalendarViewProps) {
  const { allTasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewType, setViewType] = useState<CalendarViewType>('month');

  const getCalendarRange = () => {
    switch (viewType) {
      case 'day':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        };
      case 'week':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        };
      case 'month':
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return {
          start: startOfWeek(monthStart),
          end: endOfWeek(monthEnd)
        };
    }
  };

  const { start: calendarStart, end: calendarEnd } = getCalendarRange();

  const days = [];
  let day = calendarStart;
  
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getTasksForDate = (date: Date) => {
    return allTasks.filter(task => isSameDay(task.dueDate, date));
  };

  const getSelectedDateTasks = () => {
    return selectedDate ? getTasksForDate(selectedDate) : [];
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch (viewType) {
        case 'day':
          return direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1);
        case 'week':
          return direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
        case 'month':
        default:
          return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
      }
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date('1900-01-01')) ? null : date);
  };

  const getViewTitle = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const getGridCols = () => {
    switch (viewType) {
      case 'day': return 'grid-cols-1';
      case 'week': return 'grid-cols-7';
      case 'month': return 'grid-cols-7';
      default: return 'grid-cols-7';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Calendar View</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Visual overview of compliance deadlines
          </p>
        </div>
        <button 
          onClick={() => onNewTask && onNewTask()}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Calendar Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {getViewTitle()}
                </h2>
                <div className="flex items-center space-x-4">
                  {/* View Type Selector */}
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewType('day')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        viewType === 'day'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <CalendarDays className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewType('week')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        viewType === 'week'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewType('month')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        viewType === 'month'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateCalendar('prev')}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/70"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => navigateCalendar('next')}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Headers (only for week and month views) */}
              {viewType !== 'day' && (
                <div className={`grid ${getGridCols()} gap-px mb-2`}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
              )}

              {/* Calendar Days */}
              <div className={`grid ${getGridCols()} gap-px`}>
                {(viewType === 'day' ? [currentDate] : days).map(day => (
                  <CalendarDay
                    key={day.toISOString()}
                    date={day}
                    tasks={getTasksForDate(day)}
                    isCurrentMonth={viewType === 'day' || isSameMonth(day, currentDate)}
                    isToday={isToday(day)}
                    isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                    onDateClick={handleDateClick}
                    onNewTask={onNewTask}
                    viewType={viewType}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Tasks */}
          {selectedDate && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
              </div>
              <div className="p-4">
                {getSelectedDateTasks().length > 0 ? (
                  <div className="space-y-3">
                    {getSelectedDateTasks().map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.heading}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.status === 'overdue' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : task.status === 'complete'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          }`}>
                            {task.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {format(task.dueDate, 'HH:mm')} • {task.priority} priority
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No tasks for this date</p>
                    <button
                      onClick={() => onNewTask && onNewTask(selectedDate)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Create new task
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Legend</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-100 dark:bg-red-900/50 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/50 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/50 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Complete</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                💡 Double-click any date to create a new task
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}