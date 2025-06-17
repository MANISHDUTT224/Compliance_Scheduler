import React, { ReactNode, useEffect } from 'react';
import { Header } from './Header';
import { useSettings } from '../hooks/useSettings';

interface LayoutProps {
  children: ReactNode;
  onSettingsClick?: () => void;
}

export function Layout({ children, onSettingsClick }: LayoutProps) {
  const { settings } = useSettings();

  // Apply dark mode class to document root
  useEffect(() => {
    const root = document.documentElement;
    console.log('Applying dark mode:', settings.darkMode);
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.darkMode]);

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="lg:ml-64">
          <Header onSettingsClick={onSettingsClick} />
          <main className="px-4 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}