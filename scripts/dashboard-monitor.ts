import fs from 'fs';
import path from 'path';

const WORKSPACE_DIR = './workspace';

interface ProjectData {
    id: string;
    name: string;
    mrr_target: number;
    ticket_avg: number;
    health_score: number;
    funnel: {
        visitors: number;
        signups: number;
        activated: number;
        trials: number;
        customers: number;
    };
}

function parseFrontmatter(content: string): any {
    const match = content.match(/^---([\s\S]+?)---/);
    if (!match) return null;
    
    const data: any = {};
    const lines = match[1].split('\n');
    let currentKey = "";

    for (const line of lines) {
        if (line.includes(':')) {
            const [key, ...valParts] = line.split(':');
            const val = valParts.join(':').trim();
            const cleanKey = key.trim();
            if (val) {
                data[cleanKey] = isNaN(Number(val)) ? val : Number(val);
            }
            currentKey = cleanKey;
        }
    }
    return data;
}

function loadProjects(): ProjectData[] {
    const projects: ProjectData[] = [];
    if (!fs.existsSync(WORKSPACE_DIR)) return [];
    
    const dirs = fs.readdirSync(WORKSPACE_DIR);

    for (const dir of dirs) {
        const filePath = path.join(WORKSPACE_DIR, dir, 'dashboard-data.md');
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const rawData = parseFrontmatter(content);
            if (rawData) {
                // Manual mapping for the demo
                const project: ProjectData = {
                    id: rawData.id || dir,
                    name: rawData.name || dir,
                    mrr_target: rawData.mrr_target || 0,
                    ticket_avg: rawData.ticket_avg || 0,
                    health_score: rawData.health_score || 0,
                    funnel: {
                        visitors: rawData.visitors || 0,
                        signups: rawData.signups || 0,
                        activated: rawData.activated || 0,
                        trials: rawData.trials || 0,
                        customers: rawData.customers || 0
                    }
                };
                projects.push(project);
            }
        }
    }
    return projects;
}

function monitorHealth(project: ProjectData) {
    console.log(`\n--- Monitoring Project: ${project.name} (${project.id}) ---`);
    
    const currentMRR = project.funnel.customers * project.ticket_avg;
    const mrrGap = project.mrr_target - currentMRR;
    
    console.log(`Current MRR: $${currentMRR} / Target: $${project.mrr_target}`);
    
    if (mrrGap > 0) {
        console.log(`[!] MRR GAP DETECTED: $${mrrGap}.`);
        console.log(`[ACTION] Triggering: npx tsx scripts/orchestrator.ts --chain=flow --project=${project.id}`);
    }

    if (project.funnel.visitors > 0) {
        const signupRate = project.funnel.signups / project.funnel.visitors;
        if (signupRate < 0.05) {
            console.log(`[!] CRITICAL: Low Visitor->Signup conversion (${(signupRate*100).toFixed(2)}%).`);
            console.log(`[ACTION] Triggering: npx tsx scripts/market-scout.ts --project=${project.id}`);
        }
    }
}

const allProjects = loadProjects();
if (allProjects.length === 0) {
    console.log("No project dashboard-data.md found in workspace/");
} else {
    allProjects.forEach(monitorHealth);
}
