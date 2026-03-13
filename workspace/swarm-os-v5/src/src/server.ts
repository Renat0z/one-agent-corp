import express from 'express';
import cors from 'cors';
import { artifactRoutes } from './routes/artifacts.js';
import { policyRoutes } from './routes/policies.js';
import { auditRoutes } from './routes/audit.js';
import { initDB } from './db/schema.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'artifact-guard' }));

// Routes
app.use('/api/artifacts', artifactRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/audit', auditRoutes);

// Initialize Database and Start Server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`[ArtifactGuard] Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});