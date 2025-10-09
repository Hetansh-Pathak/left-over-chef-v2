const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const PANTRY_FILE = path.join(DATA_DIR, 'pantry.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PANTRY_FILE)) fs.writeFileSync(PANTRY_FILE, JSON.stringify({ users: {} }, null, 2));

const readPantry = () => {
  try {
    return JSON.parse(fs.readFileSync(PANTRY_FILE, 'utf8'));
  } catch (e) {
    return { users: {} };
  }
};

const writePantry = (data) => {
  fs.writeFileSync(PANTRY_FILE, JSON.stringify(data, null, 2));
};

const useSupabase = () => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
};

const supabaseFetch = async (table, method = 'GET', body = null) => {
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
  const headers = {
    apikey: process.env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Supabase request failed ${res.status}`);
  return res.json();
};

// Get pantry for user (mock userId via query or header)
router.get('/', async (req, res) => {
  const userId = req.query.userId || req.header('x-user-id') || 'demo';
  if (useSupabase()) {
    try {
      const rows = await supabaseFetch('pantry', 'GET');
      const userRows = rows.filter(r => r.user_id === userId);
      return res.json({ items: userRows.map(r => ({ name: r.name, quantity: r.quantity, addedAt: r.added_at })) });
    } catch (e) {
      console.error('Supabase pantry GET error', e.message);
    }
  }
  const data = readPantry();
  res.json(data.users[userId] || { items: [] });
});

// Add or update pantry items
router.post('/', async (req, res) => {
  const userId = req.body.userId || req.header('x-user-id') || 'demo';
  const items = req.body.items || [];

  if (useSupabase()) {
    try {
      // upsert each item (simple approach)
      const payload = items.map(it => ({ user_id: userId, name: it.name, quantity: it.quantity || 1, added_at: it.addedAt || new Date().toISOString() }));
      await supabaseFetch('pantry', 'POST', payload);
      return res.json({ ok: true, items });
    } catch (e) {
      console.error('Supabase pantry POST error', e.message);
      return res.status(500).json({ ok: false, message: 'Supabase error' });
    }
  }

  const data = readPantry();
  data.users[userId] = data.users[userId] || { items: [] };

  // merge by name (case-insensitive)
  const existing = data.users[userId].items || [];
  items.forEach((it) => {
    const name = (it.name || '').toLowerCase();
    const idx = existing.findIndex(e => (e.name || '').toLowerCase() === name);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...it };
    } else {
      existing.push(it);
    }
  });

  data.users[userId].items = existing;
  writePantry(data);
  res.json({ ok: true, items: data.users[userId].items });
});

// Remove item
router.delete('/', async (req, res) => {
  const userId = req.query.userId || req.header('x-user-id') || 'demo';
  const name = (req.query.name || '').toLowerCase();
  if (!name) return res.status(400).json({ message: 'name query required' });

  if (useSupabase()) {
    try {
      const url = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/pantry?user_id=eq.${encodeURIComponent(userId)}&name=eq.${encodeURIComponent(name)}`;
      const headers = { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` };
      const r = await fetch(url, { method: 'DELETE', headers });
      if (!r.ok) throw new Error('Supabase delete failed');
      return res.json({ ok: true });
    } catch (e) {
      console.error('Supabase pantry DELETE error', e.message);
      return res.status(500).json({ ok: false, message: 'Supabase error' });
    }
  }

  const data = readPantry();
  const existing = data.users[userId]?.items || [];
  data.users[userId].items = existing.filter(e => (e.name||'').toLowerCase() !== name);
  writePantry(data);
  res.json({ ok: true });
});

module.exports = router;
