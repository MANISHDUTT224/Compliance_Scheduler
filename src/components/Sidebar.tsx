import React, { useState } from 'react';
import {
  LayoutDashboard,
  Table,
  Calendar,
  Plus,
  FileText,
  Users,
  Settings,
  Shield,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { name: 'Table View', icon: Table, view: 'table' },
  { name: 'Calendar', icon: Calendar, view: 'calendar' },
];

const tools = [
  { name: 'New Task', icon: Plus, view: 'new-task' },
  { name: 'Reports', icon: FileText, view: 'reports' },
  { name: 'Team', icon: Users, view: 'team' },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle Button (Hamburger) */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6 text-gray-800 dark:text-white" /> : <Menu className="h-6 w-6 text-gray-800 dark:text-white" />}
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-transform duration-300">
          <div className="flex flex-col h-full">
            {/* Logo & Close */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Comply</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Smart Scheduler</p>
                </div>
              </div>
              {/* Close button (small screens) */}
              <button
                className="md:hidden"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5 text-gray-800 dark:text-white" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = currentView === item.view;
                  return (
                    <button
                      key={item.name}
                      onClick={() => onViewChange(item.view)}
                      className={`w-full flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Tools
                </p>
                <div className="space-y-1">
                  {tools.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                      <button
                        key={item.name}
                        onClick={() => onViewChange(item.view)}
                        className={`w-full flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* Settings */}
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onViewChange('settings')}
                className={`w-full flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                  currentView === 'settings'
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
