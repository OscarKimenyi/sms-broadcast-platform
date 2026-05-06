import api from './axios'
export const getCampaigns = () => api.get('/campaigns')
export const getCampaign = (id) => api.get(`/campaigns/${id}`)
export const createCampaign = (data) => api.post('/campaigns', data)
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`)
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`)
export const duplicateCampaign = (id) => api.post(`/campaigns/${id}/duplicate`)
export const getCampaignLogs = (id, page = 1) => api.get(`/campaigns/${id}/logs?page=${page}&limit=50`)
export const exportCampaignLogs = (id, format = 'csv') =>
    api.get(`/export/campaigns/${id}?format=${format}`, { responseType: 'blob' })
export const exportContacts = (listId) =>
    api.get(`/export/contacts/${listId}`, { responseType: 'blob' })