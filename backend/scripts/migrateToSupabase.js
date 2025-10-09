(async () => {
  const fs = require('fs');
  const path = require('path');

  const dataDir = path.join(__dirname, '..', 'data');
  const pantryFile = path.join(dataDir, 'pantry.json');
  const achFile = path.join(dataDir, 'achievements.json');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('SUPABASE_URL or SUPABASE_SERVICE_KEY not set - aborting migration');
    process.exit(0);
  }

  const read = (p) => { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return {}; } };

  const pantry = read(pantryFile);
  const ach = read(achFile);

  const supabasePost = async (table, rows) => {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(rows)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Supabase insert failed ${res.status}: ${txt}`);
    }
    return res.json();
  };

  try {
    // Migrate pantry
    if (pantry && pantry.users) {
      const rows = [];
      for (const userId of Object.keys(pantry.users)) {
        const items = pantry.users[userId].items || [];
        for (const it of items) {
          rows.push({ user_id: userId, name: it.name, quantity: it.quantity || 1, added_at: it.addedAt || new Date().toISOString() });
        }
      }
      if (rows.length) {
        console.log('Migrating pantry rows:', rows.length);
        await supabasePost('pantry', rows);
        console.log('Pantry migrated');
      }
    }

    // Migrate achievements
    if (ach && ach.users) {
      const rows = [];
      for (const userId of Object.keys(ach.users)) {
        const user = ach.users[userId];
        const achs = user.achievements || [];
        for (const a of achs) rows.push({ user_id: userId, name: a.name, description: a.description || '', category: a.category || 'general', unlocked_at: a.unlockedAt || new Date().toISOString(), points: a.points || 0 });
      }
      if (rows.length) {
        console.log('Migrating achievements rows:', rows.length);
        await supabasePost('achievements', rows);
        console.log('Achievements migrated');
      }
    }

    console.log('Migration complete');
  } catch (e) {
    console.error('Migration error', e);
  }
})();
