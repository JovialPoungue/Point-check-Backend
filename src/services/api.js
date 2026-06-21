import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer le refresh du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh: refreshToken })
          localStorage.setItem('access_token', res.data.access)
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`
          return api(originalRequest)
        } catch (e) {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  register: (data) => api.post('/auth/register/', data),
  me: () => api.get('/auth/users/me/'),
  myCompany: () => api.get('/auth/companies/me/'),
  updateCompany: (data) => api.patch('/auth/companies/update_me/', data),
}

export const usersAPI = {
  list: (params) => api.get('/auth/users/', { params }),
  get: (id) => api.get(`/auth/users/${id}/`),
  create: (data) => api.post('/auth/users/', data),
  update: (id, data) => api.patch(`/auth/users/${id}/`, data),
  delete: (id) => api.delete(`/auth/users/${id}/`),
  resetPassword: (id, password) => api.post(`/auth/users/${id}/reset_password/`, { password }),
  setPin: (id, pin_code) => api.post(`/auth/users/${id}/set_pin/`, { pin_code }),
  toggleActive: (id) => api.post(`/auth/users/${id}/toggle_active/`),
}

export const departmentsAPI = {
  list: () => api.get('/auth/departments/'),
  create: (data) => api.post('/auth/departments/', data),
  update: (id, data) => api.patch(`/auth/departments/${id}/`, data),
  delete: (id) => api.delete(`/auth/departments/${id}/`),
}

export const attendanceAPI = {
  getCurrentQR: () => api.get('/attendance/qr/current/', { 
    headers: { 'X-Frontend-Url': window.location.origin }
  }),
  publicCheckIn: (data) => axios.post(`${API_URL}/attendance/check-in/`, data),
  records: (params) => api.get('/attendance/records/', { params }),
  todayLive: () => api.get('/attendance/records/today_live/'),
  myHistory: () => api.get('/attendance/records/my_history/'),
  daily: (params) => api.get('/attendance/daily/', { params }),
  leaves: (params) => api.get('/attendance/leaves/', { params }),
  createLeave: (data) => api.post('/attendance/leaves/', data),
  approveLeave: (id, comment) => api.post(`/attendance/leaves/${id}/approve/`, { comment }),
  rejectLeave: (id, comment) => api.post(`/attendance/leaves/${id}/reject/`, { comment }),
  disciplinary: (params) => api.get('/attendance/disciplinary/', { params }),
  createDisciplinary: (data) => api.post('/attendance/disciplinary/', data),
}

export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard/'),
  employee: (id) => api.get(`/reports/employee/${id}/`),
  exportExcel: (params) => api.get('/reports/export/excel/', { 
    params, responseType: 'blob' 
  }),
}

export const insightsAPI = {
  status: () => api.get('/insights/status/'),
  ask: (question, params = {}) => api.post('/insights/query/', { question, ...params }),
  hrSynthesis: (params = {}) => api.post('/insights/hr-synthesis/', params),
}

export default api
