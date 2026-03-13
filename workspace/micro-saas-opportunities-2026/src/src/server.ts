import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { checkRouter } from './routes/checks.js';
import { initDB } from './db/schema.js';
import { startScheduler } from './scheduler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Database
initDB();

// Routes
app.use('/api/checks', checkRouter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Scheduler
startScheduler();

app.listen(PORT, () => {
  console.log(`HormoziHook Server running on port ${PORT}`);
});