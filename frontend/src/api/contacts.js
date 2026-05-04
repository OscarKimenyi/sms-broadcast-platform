import api from './axios'

export const getLists = () => api.get('/contacts/lists')
export const createList = (data) => api.post('/contacts/lists', data)
export const deleteList = (id) => api.delete(`/contacts/lists/${id}`)
export const getContacts = (listId, page = 1) =>
    api.get(`/contacts/lists/${listId}/contacts?page=${page}&limit=50`)
export const importCSV = (listId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/contacts/lists/${listId}/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}