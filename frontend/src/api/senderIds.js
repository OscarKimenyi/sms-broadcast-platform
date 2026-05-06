import api from './axios'
export const getSenderIds = () => api.get('/sender-ids')
export const createSenderId = (data) => api.post('/sender-ids', data)
export const deleteSenderId = (id) => api.delete(`/sender-ids/${id}`)