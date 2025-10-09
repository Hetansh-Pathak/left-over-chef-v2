const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const ACH_FILE = path.join(DATA_DIR, 'achievements.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ACH_FILE)) fs.writeFileSync(ACH_FILE, JSON.stringify({ users: {} }, null, 2));

const readAch = () => {
  try { return JSON.parse(fs.readFileSync(ACH_FILE, 'utf8')); } catch (e) { return { users: {} }; }
};
const writeAch = (d) => fs.writeFileSync(ACH_FILE, JSON.stringify(d, null, 2));

const useSupabase = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

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

router.get('/', async (req, res) => {
  const userId = req.query.userId || req.header('x-user-id') || 'demo';
  if (useSupabase()) {
    try {
      const rows = await supabaseFetch('achievements', 'GET');
      const user = rows.filter(r => r.user_id === userId)[0];
      return res.json(user || { achievements: [], points: 0, streak: 0 });
    } catch (e) { console.error('Supabase achievements GET error', e.message); }
  }
  const d = readAch();
  res.json(d.users[userId] || { achievements: [], points: 0, streak: 0 });
});

router.post('/unlock', async (req, res) => {
  const userId = req.body.userId || req.header('x-user-id') || 'demo';
  const { name, description, category, points } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });

  if (useSupabase()) {
    try {
      const payload = { user_id: userId, name, description: description || '', category: category || 'general', unlocked_at: new Date().toISOString(), points: points || 0 };
      await supabaseFetch('achievements', 'POST', [payload]);
      return res.json({ ok: true, achievement: payload });
    } catch (e) { console.error('Supabase achievements POST error', e.message); return res.status(500).json({ ok: false, message: 'Supabase error' }); }
  }

  const d = readAch();
  d.users[userId] = d.users[userId] || { achievements: [], points: 0, streak: 0 };
  const exists = d.users[userId].achievements.find(a => a.name === name);
  if (!exists) {
    const entry = { name, description: description || '', category: category || 'general', unlockedAt: new Date(), points: points || 0 };
    d.users[userId].achievements.push(entry);
    d.users[userId].points = (d.users[userId].points || 0) + (points || 0);
    writeAch(d);
    return res.json({ ok: true, achievement: entry });
  }
  res.json({ ok: false, message: 'already unlocked' });
});

module.exports = router;
