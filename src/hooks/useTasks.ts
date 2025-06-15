// 
import { useState, useEffect } from 'react';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { Task, FilterType, SortType } from '../types';

// Mock data for demonstration
const mockTasks: Task[] = [
  {
    id: '1',
    heading: 'GDPR Compliance Audit',
    description: 'Annual GDPR compliance review and documentation update',
    dueDate: addDays(new Date(), 5),
    peopleInvolved: ['john.doe@company.com', 'jane.smith@company.com'],
    reminders: [
      { id: '1', type: 'email', timing: 7, sent: false },
      { id: '2', type: 'email', timing: 1, sent: false },
    ],
    notes: 'Focus on data processing agreements and consent mechanisms',
    files: [],
    status: 'in-progress',
    priority: 'high',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    createdBy: 'current-user',
    category: 'Data Protection',
  },
  // Other mock tasks...
];

const loadTasks = (): Task[] => {
  try {
    const saved = localStorage.getItem('comply-tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Loaded tasks from localStorage:', parsed);
      return parsed.map((task: Task) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
  }
  console.log('No tasks found in localStorage, using mock data.');
  return mockTasks;
}

// Save tasks to localStorage
const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem('comply-tasks', JSON.stringify(tasks));
    console.log('Tasks saved to localStorage:', tasks.length, 'tasks');
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

export function useTasks() {
  const [allTasks, setAllTasks] = useState<Task[]>(() => {
    const loaded = loadTasks();
    console.log('Initial tasks loaded:', loaded.length);
    return loaded;
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('dueDate');
  const [searchTerm, setSearchTerm] = useState('');

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    console.log('Tasks changed, saving to localStorage:', allTasks.length);
    saveTasks(allTasks);
  }, [allTasks]);

  // Update task statuses based on due dates
  useEffect(() => {
    const updateTaskStatuses = () => {
      const now = startOfDay(new Date());
      setAllTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) => {
          if (task.status === 'complete') return task;

          const dueDate = startOfDay(task.dueDate);
          const newStatus = isBefore(dueDate, now) ? 'overdue' : 'in-progress';

          return task.status !== newStatus
            ? { ...task, status: newStatus as 'in-progress' | 'overdue', updatedAt: new Date() }
            : task;
        });

        // Only update state if there are actual changes
        const hasChanges = updatedTasks.some((task, index) => 
          task.status !== prevTasks[index]?.status
        );
        
        if (hasChanges) {
          console.log('Updated task statuses:', updatedTasks);
          return updatedTasks;
        }
        
        return prevTasks;
      });
    };

    updateTaskStatuses();
    const interval = setInterval(updateTaskStatuses, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Filter and sort tasks
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

  // Add a new task
  const addTask = (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Adding new task:', task);
    
    setAllTasks((prevTasks) => {
      console.log('Previous tasks array length:', prevTasks.length);
      const updatedTasks = [...prevTasks, task];
      console.log('Updated tasks array length:', updatedTasks.length);
      console.log('New task added with ID:', task.id);
      return updatedTasks;
    });
  };

  // Update an existing task
  const updateTask = (id: string, updates: Partial<Task>) => {
    console.log('Updating task:', id, updates);
    setAllTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
      );
      console.log('Task updated successfully');
      return updatedTasks;
    });
  };

  // Delete a task
  const deleteTask = (id: string) => {
    console.log('Deleting task:', id);
    setAllTasks((prevTasks) => {
      const updatedTasks = prevTasks.filter((task) => task.id !== id);
      console.log('Task deleted successfully');
      return updatedTasks;
    });
  };

  // Get task statistics
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
  };
}