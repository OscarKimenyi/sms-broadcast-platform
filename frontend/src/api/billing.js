import api from './axios'

export const getBalance = () => api.get('/billing/balance')
export const getCreditPacks = () => api.get('/billing/packs')
export const buyCredits = (pack) => api.post('/billing/buy', { pack })
export const verifyPayment = (session_reference) =>
    api.post('/billing/verify', { session_reference })