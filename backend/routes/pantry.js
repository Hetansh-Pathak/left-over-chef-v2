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

// Get pantry for user (mock userId via query or header)
router.get('/', (req, res) => {
  const userId = req.query.userId || req.header('x-user-id') || 'demo';
  const data = readPantry();
  res.json(data.users[userId] || { items: [] });
});

// Add or update pantry items
router.post('/', (req, res) => {
  const userId = req.body.userId || req.header('x-user-id') || 'demo';
  const items = req.body.items || [];
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
router.delete('/', (req, res) => {
  const userId = req.query.userId || req.header('x-user-id') || 'demo';
  const name = (req.query.name || '').toLowerCase();
  if (!name) return res.status(400).json({ message: 'name query required' });
  const data = readPantry();
  const existing = data.users[userId]?.items || [];
  data.users[userId].items = existing.filter(e => (e.name||'').toLowerCase() !== name);
  writePantry(data);
  res.json({ ok: true });
});

module.exports = router;
