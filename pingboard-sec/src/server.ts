import express from 'express';
import { db, initDb } from './db/schema';
import cron from 'node-cron';
import { runCheck } from './services/checker';
import { sendAlert } from './services/alerter';
import { randomUUID } from 'crypto';

const app = express();
app.use(express.json());

initDb();

// HEALTH CHECK ENDPOINTS
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/checks', (req, res) => {
  const { name, url, interval_seconds = 60 } = req.body;
  const id = randomUUID();
  db.prepare(`
    INSERT INTO checks (id, name, url, interval_seconds, status)
    VALUES (?, ?, ?, ?, 'unknown')
  `).run(id, name, url, interval_seconds);
  res.status(201).json({ id, name, url, interval_seconds });
});

app.get('/api/checks', (req, res) => {
  const checks = db.prepare('SELECT * FROM checks').all();
  res.json(checks);
});

app.delete('/api/checks/:id', (req, res) => {
  db.prepare('DELETE FROM checks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.post('/api/checks/:id/run', async (req, res) => {
  const check: any = db.prepare('SELECT * FROM checks WHERE id = ?').get(req.params.id);
  if (!check) return res.status(404).end();

  const result = await runCheck(check.url);
  const newStatus = result.ok ? 'up' : 'down';
  
  db.prepare(`
    UPDATE checks 
    SET status = ?, last_checked_at = datetime('now') 
    WHERE id = ?
  `).run(newStatus, check.id);

  res.json({ id: check.id, status: newStatus, latency: result.latency });
});

// BACKGROUND SCHEDULER (Every Minute)
cron.schedule('* * * * *', async () => {
  const checks: any[] = db.prepare('SELECT * FROM checks').all();
  console.log(`[SCHEDULER] Running ${checks.length} checks...`);

  for (const check of checks) {
    const result = await runCheck(check.url);
    const newStatus = result.ok ? 'up' : 'down';

    if (newStatus !== check.status && check.status !== 'unknown') {
      const type = newStatus === 'up' ? 'recovery' : 'down';
      await sendAlert(check.name, type, check.url);
    }

    db.prepare(`
      UPDATE checks 
      SET status = ?, last_checked_at = datetime('now') 
      WHERE id = ?
    `).run(newStatus, check.id);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
