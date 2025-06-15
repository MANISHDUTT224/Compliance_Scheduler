import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, Calendar, Users, FileText, Bell, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Task, Reminder } from '../types';
import { useTasks } from '../hooks/useTasks';

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
  initialDate?: Date | null;
}

interface FormErrors {
  heading?: string;
  description?: string;
  dueDate?: string;
  category?: string;
  peopleInvolved?: string;
  general?: string;
}

export function TaskForm({ task, onClose, initialDate }: TaskFormProps) {
  const { addTask, updateTask } = useTasks();
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    heading: task?.heading || '',
    description: task?.description || '',
    dueDate: task ? format(task.dueDate, 'yyyy-MM-dd') : initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
    dueTime: task ? format(task.dueDate, 'HH:mm') : '09:00',
    priority: task?.priority || 'medium',
    category: task?.category || '',
    notes: task?.notes || '',
    status: task?.status || 'in-progress'
  });

  const [peopleInvolved, setPeopleInvolved] = useState<string[]>(task?.peopleInvolved || []);
  const [reminders, setReminders] = useState<Omit<Reminder, 'id'>[]>(
    task?.reminders?.map(r => ({ type: r.type, timing: r.timing, sent: r.sent })) || 
    [{ type: 'email', timing: 7, sent: false }, { type: 'email', timing: 1, sent: false }]
  );
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Required field validations
    if (!formData.heading.trim()) {
      newErrors.heading = 'Task heading is required';
    } else if (formData.heading.trim().length < 3) {
      newErrors.heading = 'Task heading must be at least 3 characters long';
    } else if (formData.heading.trim().length > 100) {
      newErrors.heading = 'Task heading must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(`${formData.dueDate}T${formData.dueTime}`);
      const now = new Date();
      if (selectedDate <= now && !isEditing) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    } else if (formData.category.trim().length < 2) {
      newErrors.category = 'Category must be at least 2 characters long';
    }

    // Validate people involved emails
    const invalidEmails = peopleInvolved.filter(email => !validateEmail(email));
    if (invalidEmails.length > 0) {
      newErrors.peopleInvolved = `Invalid email addresses: ${invalidEmails.join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, peopleInvolved, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setErrors({});

    try {
      if (!validateForm()) {
        return;
      }

      const dueDate = new Date(`${formData.dueDate}T${formData.dueTime}`);
      
      const taskData = {
        heading: formData.heading.trim(),
        description: formData.description.trim(),
        dueDate,
        peopleInvolved,
        reminders: reminders.map(r => ({
          ...r,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })),
        notes: formData.notes.trim(),
        files: task?.files || [],
        status: formData.status as Task['status'],
        priority: formData.priority as Task['priority'],
        category: formData.category.trim(),
        createdBy: 'current-user'
      };

      if (isEditing && task) {
        await updateTask(task.id, taskData);
      } else {
        await addTask(taskData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to save task. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addPerson = () => {
    const email = newPersonEmail.trim();
    if (!email) return;

    if (!validateEmail(email)) {
      setErrors(prev => ({ ...prev, peopleInvolved: 'Please enter a valid email address' }));
      return;
    }

    if (peopleInvolved.includes(email)) {
      setErrors(prev => ({ ...prev, peopleInvolved: 'This email is already added' }));
      return;
    }

    setPeopleInvolved(prev => [...prev, email]);
    setNewPersonEmail('');
    setErrors(prev => ({ ...prev, peopleInvolved: undefined }));
  };

  const removePerson = (email: string) => {
    setPeopleInvolved(prev => prev.filter(p => p !== email));
    setErrors(prev => ({ ...prev, peopleInvolved: undefined }));
  };

  const addReminder = () => {
    setReminders(prev => [...prev, { type: 'email', timing: 1, sent: false }]);
  };

  const removeReminder = (index: number) => {
    if (reminders.length > 1) {
      setReminders(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateReminder = (
    index: number,
    field: keyof Omit<Reminder, 'id'>,
    value: string | number | boolean
  ) => {
    setReminders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.currentTarget.getAttribute('type') === 'email') {
      e.preventDefault();
      addPerson();
    }
  };

  const renderError = (error?: string) => {
    if (!error) return null;
    return (
      <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Heading <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.heading}
                  onChange={(e) => handleInputChange('heading', e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.heading ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter task heading (3-100 characters)"
                  maxLength={100}
                />
                {renderError(errors.heading)}
                <div className="text-xs text-gray-500 mt-1">
                  {formData.heading.length}/100 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors resize-vertical disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Describe the compliance task in detail (10-1000 characters)"
                  maxLength={1000}
                />
                {renderError(errors.description)}
                <div className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/1000 characters
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {renderError(errors.dueDate)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => handleInputChange('dueTime', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., Data Protection, Financial, Safety"
                    maxLength={50}
                  />
                  {renderError(errors.category)}
                </div>
              </div>

              {/* Status (only show when editing) */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="complete">Complete</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* People Involved */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  People Involved
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={newPersonEmail}
                      onChange={(e) => setNewPersonEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isSubmitting}
                      placeholder="Enter email address"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={addPerson}
                      disabled={isSubmitting || !newPersonEmail.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {renderError(errors.peopleInvolved)}
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {peopleInvolved.map((email, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePerson(email)}
                          disabled={isSubmitting}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reminders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Reminders
                  </label>
                  <button
                    type="button"
                    onClick={addReminder}
                    disabled={isSubmitting}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {reminders.map((reminder, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={reminder.timing}
                        onChange={(e) => updateReminder(index, 'timing', parseInt(e.target.value) || 1)}
                        disabled={isSubmitting}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        min="1"
                        max="365"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">days before</span>
                      {reminders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReminder(index)}
                          disabled={isSubmitting}
                          className="text-red-500 hover:text-red-700 ml-auto p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={isSubmitting}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Additional notes, requirements, or instructions"
                  maxLength={2000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.notes.length}/2000 characters
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}