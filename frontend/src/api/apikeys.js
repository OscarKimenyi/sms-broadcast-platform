import api from './axios'
export const getApiKeys = () => api.get('/api-keys')
export const createApiKey = (data) => api.post('/api-keys', data)
export const revokeApiKey = (id) => api.patch(`/api-keys/${id}/revoke`)
export const deleteApiKey = (id) => api.delete(`/api-keys/${id}`)