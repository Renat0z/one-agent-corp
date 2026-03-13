import express from 'express';
import cors from 'cors';
import { router as checksRouter } from './routes/checks';
import { initializeDatabase } from './db/schema';
import { startScheduler } from './scheduler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', checksRouter);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'active', timestamp: new Date().toISOString() });
});

async function main() {
    try {
        initializeDatabase();
        startScheduler();
        
        app.listen(PORT, () => {
            console.log(`[ProfitBridge] Engine running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('[ProfitBridge] Initialization failed:', error);
        process.exit(1);
    }
}

main();