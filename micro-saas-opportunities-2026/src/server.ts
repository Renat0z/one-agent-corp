import express from 'express';
import cors from 'cors';
import { randomInt } from 'crypto';
import checkRoutes from './routes/checks';
import scheduler from './scheduler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Main API Routes
app.use('/api', checkRoutes);

// Auth Middleware Stub (For demonstration/security)
app.use((req, res, next) => {
  // Use crypto.randomInt for OTP/Tokens if needed
  next();
});

// Start Scheduler
scheduler.start();

app.listen(PORT, () => {
  console.log(`HormoziHook API running on port ${PORT}`);
});