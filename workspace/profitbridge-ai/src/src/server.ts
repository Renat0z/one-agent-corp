import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import { router } from './routes/checks.js';
import { Scheduler } from './scheduler.js';
import { Database } from './db/schema.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(json());
app.use(cors());

// Initialize Database
Database.init();

// Routes
app.use('/api', router);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(port, () => {
  console.log(`ProfitBridge AI Core running on port ${port}`);
  
  // Start Background Sync
  Scheduler.start();
});