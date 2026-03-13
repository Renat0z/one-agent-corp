import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initDB } from './db/schema.js';
import evolutionRouter from './routes/evolution.js';
import { Queries } from './db/queries.js';
import { SwarmEngine } from './services/swarm-engine.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

initDB();

app.use('/evolution', evolutionRouter);

// Health check for Docker/Nginx
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/leads', (_req: Request, res: Response) => {
  res.json(Queries.getAllLeads());
});

app.patch('/api/leads/:id/stage', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stageId } = req.body;
  
  Queries.updateLeadStage(id, stageId);
  await SwarmEngine.executeStageRules(id, stageId);
  
  io.emit('lead_moved', { id, stageId });
  res.sendStatus(200);
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (must be last, with 4 params)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 CRM Swarm running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});