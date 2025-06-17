import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Users, FileText, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Task, Reminder } from '../types';
import { useTasks } from '../hooks/useTasks';

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
  initialDate?: Date | null;
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.heading.trim()) {
      newErrors.heading = 'Task heading is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    const dueDate = new Date(`${formData.dueDate}T${formData.dueTime}`);
    
    const taskData = {
      heading: formData.heading.trim(),
      description: formData.description.trim(),
      dueDate,
      peopleInvolved,
      reminders: reminders.map(r => ({
        ...r,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })),
      notes: formData.notes.trim(),
      files: task?.files || [],
      status: formData.status as Task['status'],
      priority: formData.priority as Task['priority'],
      category: formData.category.trim(),
      createdBy: 'current-user'
    };

    try {
      if (isEditing && task) {
        console.log('Updating existing task:', task.id, taskData);
        await updateTask(task.id, taskData);
        setSubmitMessage({ type: 'success', text: 'Task updated successfully!' });
      } else {
        console.log('Adding new task:', taskData);
        const response = await addTask(taskData);
        setSubmitMessage({ 
          type: 'success', 
          text: `Task created successfully! ${response.emailsSent > 0 ? `${response.emailsSent} email(s) sent.` : ''}` 
        });
      }
      
      // Close form after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving task:', error);
      setSubmitMessage({ type: 'error', text: error.message || 'Error saving task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPerson = () => {
    const email = newPersonEmail.trim();
    if (email && !peopleInvolved.includes(email)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        setPeopleInvolved([...peopleInvolved, email]);
        setNewPersonEmail('');
      } else {
        setErrors({ ...errors, email: 'Please enter a valid email address' });
      }
    }
  };

  const removePerson = (email: string) => {
    setPeopleInvolved(peopleInvolved.filter(p => p !== email));
  };

  const addReminder = () => {
    setReminders([...reminders, { type: 'email', timing: 1, sent: false }]);
  };

  const removeReminder = (index: number) => {
    if (reminders.length > 1) {
      setReminders(reminders.filter((_, i) => i !== index));
    }
  };

  const updateReminder = (index: number, field: keyof Reminder, value: any) => {
    const updated = [...reminders];
    updated[index] = { ...updated[index], [field]: value };
    setReminders(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.querySelector('input[type="email"]')) {
      e.preventDefault();
      addPerson();
    }
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
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Success/Error Message */}
        {submitMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-lg border ${
            submitMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center">
              {submitMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              )}
              <p className={`text-sm ${
                submitMessage.type === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {submitMessage.text}
              </p>
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
                  onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    errors.heading ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter task heading"
                  disabled={isSubmitting}
                />
                {errors.heading && (
                  <p className="text-red-500 text-sm mt-1">{errors.heading}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors resize-vertical ${
                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Describe the compliance task in detail"
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
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
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.dueDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    disabled={isSubmitting}
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
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    disabled={isSubmitting}
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
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., Data Protection, Financial, Safety"
                    disabled={isSubmitting}
                  />
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
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
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    disabled={isSubmitting}
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
                  People Involved (Email notifications will be sent)
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={newPersonEmail}
                      onChange={(e) => setNewPersonEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter email address"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={addPerson}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
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
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          disabled={isSubmitting}
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
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    disabled={isSubmitting}
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
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        min="1"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">days before</span>
                      {reminders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReminder(index)}
                          className="text-red-500 hover:text-red-700 ml-auto p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          disabled={isSubmitting}
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
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-vertical"
                  placeholder="Additional notes, requirements, or instructions"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}