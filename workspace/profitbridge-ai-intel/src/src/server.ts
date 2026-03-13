import express from 'express';
import dotenv from 'dotenv';
import { initSchema } from './db/schema.js';
import { checkRouter } from './routes/checks.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Database
initSchema();

// Routes
app.use('/api/checks', checkRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Start Cron
startScheduler();

app.listen(port, () => {
  console.log(`ProfitBridge AI Intel Service running on port ${port}`);
});