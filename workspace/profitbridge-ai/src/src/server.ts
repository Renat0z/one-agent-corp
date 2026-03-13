import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router as auditRouter } from './routes/audit';
import { router as webhookRouter } from './routes/webhooks';
import { initDB } from './db/schema';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Database
initDB();

// Routes
app.use('/api/audit', auditRouter);
app.use('/api/webhooks', webhookRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
    console.log(`[ProfitBridge-AI] Server running on port ${PORT}`);
});