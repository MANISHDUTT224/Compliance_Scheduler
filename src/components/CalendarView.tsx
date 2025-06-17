import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Users, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfDay, endOfDay, addWeeks, subWeeks, startOfWeek as getWeekStart, endOfWeek as getWeekEnd } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types';

type ViewType = 'day' | 'week' | 'month';

interface CalendarViewProps {
  onNewTask?: (date?: Date) => void;
}

interface CalendarDayProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onDateClick: (date: Date) => void;
  onNewTask?: (date: Date) => void;
}

function CalendarDay({ date, tasks, isCurrentMonth, isToday, isSelected, onDateClick, onNewTask }: CalendarDayProps) {
  const overdueTasks = tasks.filter(task => task.status === 'overdue');
  const completeTasks = tasks.filter(task => task.status === 'complete');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');

  const handleDoubleClick = () => {
    if (onNewTask) {
      onNewTask(date);
    }
  };

  return (
    <div
      onClick={() => onDateClick(date)}
      onDoubleClick={handleDoubleClick}
      className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors duration-200 ${
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
          {format(date, 'd')}
        </span>
        {tasks.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        {tasks.slice(0, 3).map(task => (
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
            {task.heading}
          </div>
        ))}
        {tasks.length > 3 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
            +{tasks.length - 3} more
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
                      {format(task.dueDate, 'MMM d, yyyy')}
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

// Day View Component
function DayView({ date, tasks, onNewTask, onTaskClick }: { 
  date: Date; 
  tasks: Task[]; 
  onNewTask?: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>
      
      <div className="p-4">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
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
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Priority: {task.priority}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {task.category}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No tasks scheduled for this day</p>
              <button
                onClick={() => onNewTask && onNewTask(date)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
              >
                Create new task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ date, allTasks, onNewTask, onTaskClick }: { 
  date: Date; 
  allTasks: Task[]; 
  onNewTask?: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}) {
  const weekStart = getWeekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTasksForDate = (day: Date) => {
    return allTasks.filter(task => isSameDay(task.dueDate, day));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Week of {format(weekStart, 'MMMM d, yyyy')}
        </h2>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const dayTasks = getTasksForDate(day);
            return (
              <div key={day.toISOString()} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className={`p-2 text-center border-b border-gray-200 dark:border-gray-700 ${
                  isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'
                }`}>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isToday(day) 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="p-2 min-h-[120px]">
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className={`text-xs p-1 rounded cursor-pointer truncate ${
                          task.status === 'overdue' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200' 
                            : task.status === 'complete'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-200'
                        }`}
                      >
                        {task.heading}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                    {dayTasks.length === 0 && (
                      <button
                        onClick={() => onNewTask && onNewTask(day)}
                        className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 w-full text-left"
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Month View Component (your existing calendar grid)
function MonthView({ 
  currentDate, 
  allTasks, 
  selectedDate, 
  onDateClick, 
  onNewTask 
}: {
  currentDate: Date;
  allTasks: Task[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  onNewTask?: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = [];
  let day = calendarStart;
  
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getTasksForDate = (date: Date) => {
    return allTasks.filter(task => isSameDay(task.dueDate, date));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px">
          {days.map(day => (
            <CalendarDay
              key={day.toISOString()}
              date={day}
              tasks={getTasksForDate(day)}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isToday={isToday(day)}
              isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
              onDateClick={onDateClick}
              onNewTask={onNewTask}
            />
          ))}
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
  const [viewType, setViewType] = useState<ViewType>('month');

  const getTasksForDate = (date: Date) => {
    return allTasks.filter(task => isSameDay(task.dueDate, date));
  };

  const getSelectedDateTasks = () => {
    return selectedDate ? getTasksForDate(selectedDate) : [];
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch (viewType) {
        case 'day':
          return direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1);
        case 'week':
          return direction === 'prev' ? addWeeks(prev, -1) : addWeeks(prev, 1);
        case 'month':
        default:
          return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
      }
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date('1900-01-01')) ? null : date);
  };

  const getHeaderTitle = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = getWeekStart(currentDate);
        const weekEnd = getWeekEnd(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
      default:
        return format(currentDate, 'MMMM yyyy');
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

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] text-center">
            {getHeaderTitle()}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-4 px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/70"
          >
            Today
          </button>
        </div>

        {/* View Type Selector */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['day', 'week', 'month'] as ViewType[]).map(view => (
            <button
              key={view}
              onClick={() => setViewType(view)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                viewType === view
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar View */}
        <div className="lg:col-span-3">
          {viewType === 'day' && (
            <DayView 
              date={currentDate} 
              tasks={getTasksForDate(currentDate)} 
              onNewTask={onNewTask}
              onTaskClick={setSelectedTask}
            />
          )}
          {viewType === 'week' && (
            <WeekView 
              date={currentDate} 
              allTasks={allTasks} 
              onNewTask={onNewTask}
              onTaskClick={setSelectedTask}
            />
          )}
          {viewType === 'month' && (
            <MonthView
              currentDate={currentDate}
              allTasks={allTasks}
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              onNewTask={onNewTask}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Tasks (only for month view) */}
          {viewType === 'month' && selectedDate && (
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

          {/* Current View Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {viewType === 'day' ? 'Day' : viewType === 'week' ? 'Week' : 'Month'} Summary
              </h3>
            </div>
            <div className="p-4">
              {(() => {
                let periodTasks = [];
                
                if (viewType === 'day') {
                  periodTasks = getTasksForDate(currentDate);
                } else if (viewType === 'week') {
                  const weekStart = getWeekStart(currentDate);
                  const weekEnd = getWeekEnd(currentDate);
                  periodTasks = allTasks.filter(task => 
                    task.dueDate >= weekStart && task.dueDate <= weekEnd
                  );
                } else {
                  const monthStart = startOfMonth(currentDate);
                  const monthEnd = endOfMonth(currentDate);
                  periodTasks = allTasks.filter(task => 
                    task.dueDate >= monthStart && task.dueDate <= monthEnd
                  );
                }

                const overdueTasks = periodTasks.filter(task => task.status === 'overdue');
                const completeTasks = periodTasks.filter(task => task.status === 'complete');
                const inProgressTasks = periodTasks.filter(task => task.status === 'in-progress');

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {periodTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600 dark:text-red-400">Overdue:</span>
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">
                        {overdueTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-600 dark:text-blue-400">In Progress:</span>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        {inProgressTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 dark:text-green-400">Complete:</span>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {completeTasks.length}
                      </span>
                    </div>
                    
                    {periodTasks.length > 0 && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {Math.round((completeTasks.length / periodTasks.length) * 100)}%
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(completeTasks.length / periodTasks.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
          

       