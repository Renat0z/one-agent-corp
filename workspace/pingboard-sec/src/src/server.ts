import express from 'express';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/schema.js';
import checkRoutes from './routes/checks.js';
import { syncScheduler } from './scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Infrastructure
initializeDatabase();
syncScheduler();

// Routes
app.use('/api/checks', checkRoutes);

// Health Check for the monitor itself
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'active', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`[Pingboard-Sec] Server running on port ${PORT}`);
});

export default app;