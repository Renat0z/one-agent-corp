import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { router as webhookRouter } from './routes/webhooks.js';
import { router as adsRouter } from './routes/ads.js';
import { scheduler } from './scheduler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/webhooks', webhookRouter);
app.use('/api/ads', adsRouter);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'active', timestamp: new Date().toISOString() }));

// Start Scheduler
scheduler.start();

app.listen(PORT, () => {
  console.log(`ProfitBridge AI running on port ${PORT}`);
});