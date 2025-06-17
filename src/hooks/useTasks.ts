import { useState, useEffect } from 'react';
import { Task, FilterType, SortType } from '../types';
import { tasksAPI } from '../services/api';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

export function useTasks() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('dueDate');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from API
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const tasks = await tasksAPI.getTasks();
      console.log('Tasks loaded from API:', tasks.length);
      setAllTasks(tasks);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTasks();
  }, []);

  // Auto-refresh tasks every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update task statuses based on due dates
  useEffect(() => {
    const updateTaskStatuses = () => {
      const now = startOfDay(new Date());
      setAllTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.status === 'complete') return task;
          
          const dueDate = startOfDay(task.dueDate);
          const newStatus = isBefore(dueDate, now) ? 'overdue' : 'in-progress';
          
          return task.status !== newStatus 
            ? { ...task, status: newStatus as 'in-progress' | 'overdue', updatedAt: new Date() }
            : task;
        })
      );
    };

    updateTaskStatuses();
    const interval = setInterval(updateTaskStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredAndSortedTasks = allTasks
    .filter(task => {
      if (filter !== 'all' && task.status !== filter) return false;
      if (searchTerm && !task.heading.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'priority':
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          const statusOrder = { 'overdue': 3, 'in-progress': 2, 'complete': 1 };
          return statusOrder[b.status] - statusOrder[a.status];
        case 'heading':
          return a.heading.localeCompare(b.heading);
        default:
          return 0;
      }
    });

  const addTask = async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      console.log('Creating new task:', newTask);
      const response = await tasksAPI.createTask(newTask);
      console.log('Task created successfully:', response);
      
      // Refresh tasks to get the latest data
      await loadTasks();
      
      return response;
    } catch (err: any) {
      console.error('Error creating task:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      setError(null);
      console.log('Updating task:', id, updates);
      await tasksAPI.updateTask(id, updates);
      
      // Refresh tasks to get the latest data
      await loadTasks();
    } catch (err: any) {
      console.error('Error updating task:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setError(null);
      console.log('Deleting task:', id);
      await tasksAPI.deleteTask(id);
      
      // Refresh tasks to get the latest data
      await loadTasks();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getTaskStats = () => {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'complete').length;
    const overdue = allTasks.filter(t => t.status === 'overdue').length;
    const inProgress = allTasks.filter(t => t.status === 'in-progress').length;
    const upcomingDueSoon = allTasks.filter(t => 
      t.status === 'in-progress' && 
      isAfter(addDays(new Date(), 7), t.dueDate)
    ).length;

    return { total, completed, overdue, inProgress, upcomingDueSoon };
  };

  return {
    tasks: filteredAndSortedTasks,
    allTasks,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    addTask,
    updateTask,
    deleteTask,
    getTaskStats,
    loadTasks,
    isLoading,
    error
  };
}