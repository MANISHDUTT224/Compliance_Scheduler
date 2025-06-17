import React, { useState } from 'react';
import { Download, FileText, Calendar, TrendingUp, BarChart3, PieChart, Users, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useTasks } from '../hooks/useTasks';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  onGenerate: () => void;
}

function ReportCard({ title, description, icon: Icon, color, bgColor, onGenerate }: ReportCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`p-3 rounded-lg ${bgColor} w-fit mb-4`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
          <button
            onClick={onGenerate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple CSV export function (fallback if jsPDF fails)
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Enhanced PDF generation with better error handling
const generatePDF = async (title: string, data: any[], headers: string[], filename: string) => {
  try {
    // Try to use jsPDF if available
    const { default: jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    // Add generation date
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 35);
    
    // Add data count
    doc.text(`Total records: ${data.length}`, 20, 45);

    if (data.length > 0) {
      // Try to use autoTable if available
      try {
        const autoTable = (await import('jspdf-autotable')).default;
        
        // @ts-ignore
        doc.autoTable({
          head: [headers],
          body: data,
          startY: 55,
          styles: {
            fontSize: 10,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255
          }
        });
      } catch (autoTableError) {
        // Fallback: add data as simple text
        let yPosition = 60;
        data.forEach((row, index) => {
          if (yPosition > 250) { // Start new page if needed
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${index + 1}. ${headers.map(h => `${h}: ${row[headers.indexOf(h)]}`).join(', ')}`, 20, yPosition);
          yPosition += 10;
        });
      }
    } else {
      doc.text('No data available for this report.', 20, 60);
    }

    doc.save(filename);
    
  } catch (pdfError) {
    console.error('PDF generation failed:', pdfError);
    // Fallback to CSV export
    const csvData = data.map(row => {
      const csvRow: any = {};
      headers.forEach((header, index) => {
        csvRow[header] = row[index];
      });
      return csvRow;
    });
    exportToCSV(csvData, filename.replace('.pdf', '.csv'));
    alert('PDF generation failed. Report exported as CSV instead.');
  }
};

export function ReportsView() {
  const { allTasks, getTaskStats } = useTasks();
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = getTaskStats();

  const generateTaskSummaryReport = async () => {
    setIsGenerating(true);
    try {
      const reportData = allTasks.map(task => [
        task.heading,
        format(task.dueDate, 'MMM d, yyyy'),
        task.priority,
        task.status.replace('-', ' '),
        task.category,
        task.peopleInvolved.length.toString()
      ]);

      await generatePDF(
        'Compliance Task Summary Report',
        reportData,
        ['Task', 'Due Date', 'Priority', 'Status', 'Category', 'People'],
        `compliance-summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      );
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateOverdueReport = async () => {
    setIsGenerating(true);
    try {
      const overdueTasks = allTasks.filter(task => task.status === 'overdue');
      
      if (overdueTasks.length === 0) {
        alert('No overdue tasks found!');
        setIsGenerating(false);
        return;
      }

      const reportData = overdueTasks.map(task => [
        task.heading,
        format(task.dueDate, 'MMM d, yyyy'),
        task.priority,
        task.category,
        task.peopleInvolved.join(', ')
      ]);

      await generatePDF(
        'Overdue Tasks Report',
        reportData,
        ['Task', 'Due Date', 'Priority', 'Category', 'People Involved'],
        `overdue-tasks-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      );
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateComplianceReport = async () => {
    setIsGenerating(true);
    try {
      const categories = [...new Set(allTasks.map(task => task.category))];
      const categoryStats = categories.map(category => {
        const categoryTasks = allTasks.filter(task => task.category === category);
        const completed = categoryTasks.filter(task => task.status === 'complete').length;
        const total = categoryTasks.length;
        return [
          category,
          total.toString(),
          completed.toString(),
          total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%'
        ];
      });

      await generatePDF(
        'Compliance Status Report',
        categoryStats,
        ['Category', 'Total Tasks', 'Completed', 'Completion Rate'],
        `compliance-status-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      );
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTeamReport = async () => {
    setIsGenerating(true);
    try {
      const allPeople = [...new Set(allTasks.flatMap(task => task.peopleInvolved))];
      
      if (allPeople.length === 0) {
        alert('No team members found in tasks!');
        setIsGenerating(false);
        return;
      }

      const teamStats = allPeople.map(person => {
        const personTasks = allTasks.filter(task => task.peopleInvolved.includes(person));
        const completed = personTasks.filter(task => task.status === 'complete').length;
        const overdue = personTasks.filter(task => task.status === 'overdue').length;
        return [
          person,
          personTasks.length.toString(),
          completed.toString(),
          overdue.toString(),
          personTasks.length > 0 ? `${Math.round((completed / personTasks.length) * 100)}%` : '0%'
        ];
      });

      await generatePDF(
        'Team Performance Report',
        teamStats,
        ['Team Member', 'Total Tasks', 'Completed', 'Overdue', 'Completion Rate'],
        `team-performance-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      );
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          Generate comprehensive compliance reports and analytics
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Report Period</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/50">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/50">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Tasks</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.overdue}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/50">
              <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Members</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {[...new Set(allTasks.flatMap(task => task.peopleInvolved))].length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/50">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isGenerating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-800 dark:text-blue-200">Generating report...</p>
          </div>
        </div>
      )}

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard
          title="Task Summary Report"
          description="Comprehensive overview of all compliance tasks, their status, and key metrics"
          icon={BarChart3}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-900/50"
          onGenerate={generateTaskSummaryReport}
        />

        <ReportCard
          title="Overdue Tasks Report"
          description="Detailed list of all overdue tasks requiring immediate attention"
          icon={Clock}
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-50 dark:bg-red-900/50"
          onGenerate={generateOverdueReport}
        />

        <ReportCard
          title="Compliance Status Report"
          description="Category-wise compliance status and completion rates"
          icon={PieChart}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-50 dark:bg-green-900/50"
          onGenerate={generateComplianceReport}
        />

        <ReportCard
          title="Team Performance Report"
          description="Individual team member performance and task completion metrics"
          icon={Users}
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-50 dark:bg-purple-900/50"
          onGenerate={generateTeamReport}
        />
      </div>
    </div>
  );
}