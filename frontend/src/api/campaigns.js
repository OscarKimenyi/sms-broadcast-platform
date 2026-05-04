import api from './axios'

export const getCampaigns = () => api.get('/campaigns')
export const getCampaign = (id) => api.get(`/campaigns/${id}`)
export const createCampaign = (data) => api.post('/campaigns', data)
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`)
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`)
export const getCampaignLogs = (id, page = 1) =>
    api.get(`/campaigns/${id}/logs?page=${page}&limit=50`)