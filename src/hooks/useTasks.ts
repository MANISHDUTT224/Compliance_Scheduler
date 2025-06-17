import { useState, useEffect } from 'react';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { Task, FilterType, SortType } from '../types';

// API service functions
const API_BASE_URL = 'http://localhost:5000/api';

const apiService = {
  getTasks: async (email) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${email}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  createTask: async (taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  updateTask: async (id, updates) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  deleteTask: async (id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return response.json();
  }
};

// Transform backend task to frontend format
const transformBackendTask = (backendTask) => {
  return {
    id: backendTask._id,
    heading: backendTask.title,
    description: backendTask.description,
    dueDate: new Date(backendTask.dueDate),
    peopleInvolved: backendTask.assignedTo || [],
    reminders: [], // You can map this if you add reminders to backend
    notes: backendTask.description, // Using description as notes for now
    files: [], // Add if you implement file uploads
    status: backendTask.status,
    priority: backendTask.priority,
    createdAt: new Date(backendTask.createdAt),
    updatedAt: new Date(backendTask.updatedAt),
    createdBy: backendTask.userEmail,
    category: backendTask.category || 'General',
  };
};

// Transform frontend task to backend format
const transformFrontendTask = (frontendTask, userEmail) => {
  return {
    title: frontendTask.heading,
    description: frontendTask.description,
    dueDate: frontendTask.dueDate,
    assignedTo: frontendTask.peopleInvolved || [],
    status: frontendTask.status,
    priority: frontendTask.priority,
    category: frontendTask.category || 'General',
    userEmail: userEmail,
  };
};

export function useTasks(userEmail) {
  const [allTasks, setAllTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load tasks from backend
  const loadTasks = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const backendTasks = await apiService.getTasks(userEmail);
      const transformedTasks = backendTasks.map(transformBackendTask);
      setAllTasks(transformedTasks);
      console.log('Tasks loaded from backend:', transformedTasks.length);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err.message);
      // Fallback to localStorage if backend fails
      try {
        const saved = localStorage.getItem('comply-tasks');
        if (saved) {
          const parsed = JSON.parse(saved);
          const transformedLocal = parsed.map((task) => ({
            ...task,
            dueDate: new Date(task.dueDate),
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
          }));
          setAllTasks(transformedLocal);
          console.log('Loaded tasks from localStorage as fallback');
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load tasks when userEmail changes
  useEffect(() => {
    loadTasks();
  }, [userEmail]);

  // Backup to localStorage (keep as fallback)
  useEffect(() => {
    if (allTasks.length > 0) {
      try {
        localStorage.setItem('comply-tasks', JSON.stringify(allTasks));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [allTasks]);

  // Update task statuses based on due dates (keep local logic)
  useEffect(() => {
    const updateTaskStatuses = () => {
      const now = startOfDay(new Date());
      setAllTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) => {
          if (task.status === 'complete') return task;

          const dueDate = startOfDay(task.dueDate);
          const newStatus = isBefore(dueDate, now) ? 'overdue' : 'in-progress';

          return task.status !== newStatus
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task;
        });

        const hasChanges = updatedTasks.some((task, index) => 
          task.status !== prevTasks[index]?.status
        );
        
        return hasChanges ? updatedTasks : prevTasks;
      });
    };

    updateTaskStatuses();
    const interval = setInterval(updateTaskStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort tasks (keep existing logic)
  const filteredAndSortedTasks = allTasks
    .filter((task) => {
      if (filter !== 'all' && task.status !== filter) return false;
      if (
        searchTerm &&
        !task.heading.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'priority': {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'status': {
          const statusOrder = { overdue: 3, 'in-progress': 2, complete: 1 };
          return statusOrder[b.status] - statusOrder[a.status];
        }
        case 'heading':
          return a.heading.localeCompare(b.heading);
        default:
          return 0;
      }
    });

  // Add a new task - now with backend integration
  const addTask = async (newTask) => {
    if (!userEmail) {
      setError('User email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Transform and send to backend
      const backendTaskData = transformFrontendTask(newTask, userEmail);
      const createdTask = await apiService.createTask(backendTaskData);
      
      // Transform back and add to local state
      const transformedTask = transformBackendTask(createdTask);
      setAllTasks((prevTasks) => [...prevTasks, transformedTask]);
      
      console.log('Task added successfully:', transformedTask.id);
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.message);
      
      // Fallback: add locally with temp ID
      const task = {
        ...newTask,
        id: 'temp_' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userEmail,
      };
      setAllTasks((prevTasks) => [...prevTasks, task]);
    } finally {
      setLoading(false);
    }
  };

  // Update an existing task - now with backend integration
  const updateTask = async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      // Update in backend
      await apiService.updateTask(id, updates);
      
      // Update local state
      setAllTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
        )
      );
      
      console.log('Task updated successfully:', id);
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message);
      
      // Fallback: update locally
      setAllTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete a task - now with backend integration
  const deleteTask = async (id) => {
    setLoading(true);
    setError(null);

    try {
      // Delete from backend
      await apiService.deleteTask(id);
      
      // Remove from local state
      setAllTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      
      console.log('Task deleted successfully:', id);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message);
      
      // Fallback: delete locally
      setAllTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } finally {
      setLoading(false);
    }
  };

  // Get task statistics (keep existing logic)
  const getTaskStats = () => {
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === 'complete').length;
    const overdue = allTasks.filter((t) => t.status === 'overdue').length;
    const inProgress = allTasks.filter((t) => t.status === 'in-progress').length;
    const upcomingDueSoon = allTasks.filter(
      (t) => t.status === 'in-progress' && isAfter(addDays(new Date(), 7), t.dueDate)
    ).length;

    return { total, completed, overdue, inProgress, upcomingDueSoon };
  };

  // Refresh tasks from backend
  const refreshTasks = () => {
    loadTasks();
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
    refreshTasks,
    loading,
    error,
  };
}