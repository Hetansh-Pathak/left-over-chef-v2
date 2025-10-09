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

router.get('/', (req, res) => {
  const userId = req.query.userId || req.header('x-user-id') || 'demo';
  const d = readAch();
  res.json(d.users[userId] || { achievements: [], points: 0, streak: 0 });
});

router.post('/unlock', (req, res) => {
  const userId = req.body.userId || req.header('x-user-id') || 'demo';
  const { name, description, category, points } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
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
