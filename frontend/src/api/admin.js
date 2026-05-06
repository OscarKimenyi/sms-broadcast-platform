import api from './axios'
export const getAdminStats = () => api.get('/admin/stats')
export const getAdminUsers = (page, search) => api.get(`/admin/users?page=${page}&search=${search || ''}`)
export const adjustCredits = (data) => api.post('/admin/credits', data)
export const getPendingSenderIds = () => api.get('/admin/sender-ids/pending')
export const approveSenderId = (id) => api.patch(`/admin/sender-ids/${id}/approve`)
export const rejectSenderId = (id) => api.patch(`/admin/sender-ids/${id}/reject`)