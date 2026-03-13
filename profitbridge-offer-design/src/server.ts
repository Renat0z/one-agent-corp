import express from 'express';
import dotenv from 'dotenv';
import { initSchema } from './db/schema';
import { startScheduler } from './scheduler';
import bridgeRoutes from './routes/checks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Database Schema
initSchema();

// Start Background Arbitrage Checker
startScheduler();

// API Routes
app.use('/api/bridge', bridgeRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`[ProfitBridge AI] Server running on port ${PORT}`);
});
