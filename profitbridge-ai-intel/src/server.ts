import express from 'express';
import cors from 'cors';
import { initSchema } from './db/schema';
import { queries } from './db/queries';
import { checkService } from './services/checker';
import cron from 'node-cron';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize DB
initSchema();

// API Endpoints
app.get('/health', (req, res) => res.json({ status: 'up' }));

app.post('/api/checks', (req, res) => {
  const { name, url, expected_status, alert_webhook_url } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Missing name or url' });

  const result = queries.createCheck({ name, url, expected_status, alert_webhook_url });
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/checks', (req, res) => {
  const checks = queries.getAllChecks();
  res.json(checks);
});

app.post('/api/checks/:id/run', async (req, res) => {
  const checks = queries.getAllChecks();
  const check = checks.find(c => c.id === parseInt(req.params.id));
  if (!check) return res.status(404).json({ error: 'Check not found' });

  const result = await checkService(check);
  res.json(result);
});

// Scheduler: Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const checks = queries.getAllChecks();
  for (const check of checks) {
    try {
      await checkService(check);
    } catch (e) {
      console.error(`Error checking ${check.name}:`, e);
    }
  }
});

app.listen(port, () => {
  console.log(`ProfitBridge AI Intel listening on port ${port}`);
});
