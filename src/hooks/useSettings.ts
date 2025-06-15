import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const defaultSettings: AppSettings = {
  darkMode: false,
  emailNotifications: true,
  defaultView: 'dashboard',
  reminderDefaults: [7, 1] // 7 days and 1 day before due date
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('comply-settings');
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...defaultSettings, ...parsed };
      console.log('Settings loaded:', merged);
      return merged;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      console.log('Saving settings:', settings);
      localStorage.setItem('comply-settings', JSON.stringify(settings));
      
      // Apply dark mode to document immediately
      const root = document.documentElement;
      if (settings.darkMode) {
        root.classList.add('dark');
        console.log('Dark mode applied to document');
      } else {
        root.classList.remove('dark');
        console.log('Light mode applied to document');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    console.log('Updating setting:', key, 'to:', value);
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      console.log('Settings updated:', updated);
      return updated;
    });
  };

  const resetSettings = () => {
    console.log('Resetting settings to default');
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSetting,
    resetSettings
  };
}