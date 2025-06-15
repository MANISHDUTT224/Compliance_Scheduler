import React, { useState } from 'react';
import { Moon, Sun, Bell, Mail, Calendar, Users, Shield, Database, Download, Upload, Save, RotateCcw } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/50">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function ToggleSetting({ label, description, enabled, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsView() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'manager'
  });
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify({ settings, userProfile }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `comply-settings-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showSuccessMessage('Settings exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting settings. Please try again.');
    }
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);
            
            // Validate and update settings
            if (importedData.settings) {
              Object.keys(importedData.settings).forEach(key => {
                if (key in settings) {
                  updateSetting(key as keyof typeof settings, importedData.settings[key]);
                }
              });
            }
            
            // Update user profile if present
            if (importedData.userProfile) {
              setUserProfile(prev => ({ ...prev, ...importedData.userProfile }));
            }
            
            showSuccessMessage('Settings imported successfully!');
          } catch (error) {
            console.error('Import error:', error);
            alert('Error importing settings. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSaveChanges = () => {
    // Settings are automatically saved via useSettings hook
    // This is just for user feedback
    showSuccessMessage('Settings saved successfully!');
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      resetSettings();
      showSuccessMessage('Settings reset to default values!');
    }
  };

  const showSuccessMessage = (message: string) => {
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  const updateReminderDefault = (index: number, value: number) => {
    const newDefaults = [...settings.reminderDefaults];
    newDefaults[index] = value;
    updateSetting('reminderDefaults', newDefaults);
  };

  const addReminderDefault = () => {
    updateSetting('reminderDefaults', [...settings.reminderDefaults, 1]);
  };

  const removeReminderDefault = (index: number) => {
    const newDefaults = settings.reminderDefaults.filter((_, i) => i !== index);
    updateSetting('reminderDefaults', newDefaults);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          Customize your compliance management experience
        </p>
      </div>

      {/* Success Message */}
      {showSaveMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Save className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Settings saved successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Appearance Settings */}
        <SettingsSection
          title="Appearance"
          description="Customize the look and feel of your workspace"
          icon={Moon}
        >
          <div className="space-y-4">
            <ToggleSetting
              label="Dark Mode"
              description="Switch between light and dark themes"
              enabled={settings.darkMode}
              onChange={(enabled) => updateSetting('darkMode', enabled)}
            />
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Default View</h4>
              <select
                value={settings.defaultView}
                onChange={(e) => updateSetting('defaultView', e.target.value as any)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="dashboard">Dashboard</option>
                <option value="table">Table View</option>
                <option value="calendar">Calendar View</option>
              </select>
            </div>
          </div>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection
          title="Notifications"
          description="Manage how and when you receive notifications"
          icon={Bell}
        >
          <div className="space-y-4">
            <ToggleSetting
              label="Email Notifications"
              description="Receive email notifications for task reminders and updates"
              enabled={settings.emailNotifications}
              onChange={(enabled) => updateSetting('emailNotifications', enabled)}
            />
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Default Reminder Schedule</h4>
                <button
                  onClick={addReminderDefault}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Add Reminder
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Set default reminder timing for new tasks (days before due date)
              </p>
              <div className="space-y-2">
                {settings.reminderDefaults.map((days, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                    <input
                      type="number"
                      value={days}
                      onChange={(e) => updateReminderDefault(index, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">days before</span>
                    {settings.reminderDefaults.length > 1 && (
                      <button
                        onClick={() => removeReminderDefault(index)}
                        className="text-red-500 hover:text-red-700 text-sm ml-auto"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Account Settings */}
        <SettingsSection
          title="Account"
          description="Manage your account information and preferences"
          icon={Users}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={userProfile.email}
                onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={userProfile.role}
                onChange={(e) => setUserProfile(prev => ({ ...prev, role: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="admin">Administrator</option>
                <option value="manager">Compliance Manager</option>
                <option value="member">Team Member</option>
              </select>
            </div>
          </div>
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection
          title="Data Management"
          description="Import, export, and manage your compliance data"
          icon={Database}
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={exportSettings}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Settings
              </button>
              
              <button
                onClick={importSettings}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Settings
              </button>

              <button
                onClick={handleResetSettings}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </button>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Data Retention</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Automatically archive completed tasks after a specified period
              </p>
              <select
                defaultValue="never"
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="never">Never archive</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </div>
        </SettingsSection>

        {/* Security Settings */}
        <SettingsSection
          title="Security"
          description="Manage security and privacy settings"
          icon={Shield}
        >
          <div className="space-y-4">
            <ToggleSetting
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              enabled={false}
              onChange={() => alert('Two-factor authentication setup would be implemented here')}
            />
            
            <ToggleSetting
              label="Session Timeout"
              description="Automatically log out after period of inactivity"
              enabled={true}
              onChange={() => alert('Session timeout settings would be configured here')}
            />
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button 
                onClick={() => alert('Password change functionality would be implemented here')}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Change Password
              </button>
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <button 
          onClick={handleSaveChanges}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Save className="h-4 w-4 mr-2 inline" />
          Save Changes
        </button>
      </div>
    </div>
  );
}