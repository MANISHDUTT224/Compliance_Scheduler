import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TableView } from './components/TableView';
import { CalendarView } from './components/CalendarView';
import { TaskForm } from './components/TaskForm';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TeamView } from './components/TeamView';
import { ViewType } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

export default App;