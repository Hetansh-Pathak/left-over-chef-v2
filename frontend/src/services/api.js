import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  withCredentials: true,
});

export const pantryGet = (userId='demo') => api.get(`/pantry?userId=${encodeURIComponent(userId)}`).then(r=>r.data);
export const pantrySave = (items, userId='demo') => api.post('/pantry', { userId, items }).then(r=>r.data);
export const pantryRemove = (name, userId='demo') => api.delete(`/pantry?userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name)}`).then(r=>r.data);

export const achievementsGet = (userId='demo') => api.get(`/achievements?userId=${encodeURIComponent(userId)}`).then(r=>r.data);
export const achievementsUnlock = (payload) => api.post('/achievements/unlock', payload).then(r=>r.data);

export default api;
