import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TableView } from './components/TableView';
import { CalendarView } from './components/CalendarView';
import { TaskForm } from './components/TaskForm';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TeamView } from './components/TeamView';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ViewType } from './types';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isLoading } = useAuth();

  // Show auth modal if user is not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true);
    }
  }, [user, isLoading]);

  const handleViewChange = (view: string) => {
    console.log('View change requested:', view);
    if (view === 'new-task') {
      setShowTaskForm(true);
    } else {
      setCurrentView(view as ViewType);
    }
  };

  const handleNewTask = (date?: Date) => {
    console.log('New task requested for date:', date);
    setSelectedDate(date || null);
    setShowTaskForm(true);
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked from header');
    setCurrentView('settings');
  };

  const handleTaskFormClose = () => {
    console.log('Task form closed');
    setShowTaskForm(false);
    setSelectedDate(null);
  };

  const renderCurrentView = () => {
    console.log('Rendering view:', currentView);
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNewTask={handleNewTask} onViewChange={handleViewChange} />;
      case 'table':
        return <TableView onNewTask={handleNewTask} />;
      case 'calendar':
        return <CalendarView onNewTask={handleNewTask} />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      case 'team':
        return <TeamView />;
      default:
        return <Dashboard onNewTask={handleNewTask} onViewChange={handleViewChange} />;
    }
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render main app if user is not authenticated
  if (!user) {
    return (
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <Layout onSettingsClick={handleSettingsClick}>
        {renderCurrentView()}
      </Layout>
      
      {showTaskForm && (
        <TaskForm 
          onClose={handleTaskFormClose}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;