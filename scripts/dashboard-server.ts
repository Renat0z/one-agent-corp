import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;
const WORKSPACE_DIR = './workspace';

app.use(express.json());

// API para listar saúde dos projetos
app.get('/api/status', (req, res) => {
    const projects = [];
    const dirs = fs.readdirSync(WORKSPACE_DIR);
    for (const dir of dirs) {
        const dataPath = path.join(WORKSPACE_DIR, dir, 'dashboard-data.md');
        if (fs.existsSync(dataPath)) {
            projects.push({ id: dir, content: fs.readFileSync(dataPath, 'utf8') });
        }
    }
    res.json(projects);
});

// Endpoint para disparar scripts manualmente via UI
app.post('/api/trigger', async (req, res) => {
    const { project, chain } = req.body;
    const cmd = `npx tsx scripts/orchestrator.ts --chain=${chain} --project=${project}`;
    exec(cmd); // Roda em background
    res.json({ message: `Triggered ${chain} for ${project}` });
});

app.listen(PORT, () => {
    console.log(`[DASHBOARD] Interface ativa em http://localhost:${PORT}`);
});
