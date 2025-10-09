import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  withCredentials: true,
});

export const pantryGet = async (userId='demo') => {
  try {
    const r = await api.get(`/pantry?userId=${encodeURIComponent(userId)}`);
    return r.data;
  } catch (e) {
    console.error('pantryGet error', e && e.response ? e.response.data : e.message || e);
    return { items: [] };
  }
};

export const pantrySave = async (items, userId='demo') => {
  try {
    const r = await api.post('/pantry', { userId, items });
    return r.data;
  } catch (e) {
    console.error('pantrySave error', e && e.response ? e.response.data : e.message || e);
    throw e;
  }
};

export const pantryRemove = async (name, userId='demo') => {
  try {
    const r = await api.delete(`/pantry?userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name)}`);
    return r.data;
  } catch (e) {
    console.error('pantryRemove error', e && e.response ? e.response.data : e.message || e);
    throw e;
  }
};

export const achievementsGet = async (userId='demo') => {
  try {
    const r = await api.get(`/achievements?userId=${encodeURIComponent(userId)}`);
    return r.data;
  } catch (e) {
    console.error('achievementsGet error', e && e.response ? e.response.data : e.message || e);
    return { achievements: [], points: 0, streak: 0 };
  }
};

export const achievementsUnlock = async (payload) => {
  try {
    const r = await api.post('/achievements/unlock', payload);
    return r.data;
  } catch (e) {
    console.error('achievementsUnlock error', e && e.response ? e.response.data : e.message || e);
    throw e;
  }
};

export default api;
