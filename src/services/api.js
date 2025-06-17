const API_BASE_URL = 'http://localhost:5000/api';

export const apiService = {
  // Auth
  validateEmail: (email) => 
    fetch(`${API_BASE_URL}/auth/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(res => res.json()),

  // Tasks
  getTasks: (email) => 
    fetch(`${API_BASE_URL}/tasks/${email}`).then(res => res.json()),

  createTask: (taskData) =>
    fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    }).then(res => res.json()),

  updateTask: (id, updates) =>
    fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => res.json()),

  deleteTask: (id) =>
    fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE'
    }).then(res => res.json()),

  // Dashboard
  getDashboardStats: (email) =>
    fetch(`${API_BASE_URL}/dashboard/${email}`).then(res => res.json())
};