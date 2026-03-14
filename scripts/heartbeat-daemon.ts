import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * HEARTBEAT DAEMON v2.0 - CLAUDIO-HARD Edition
 * - Orquestra UM ÚNICO projeto por vez.
 * - Ciclo de 15 minutos (900.000ms).
 * - Prioriza Correção (Audit) > Criação (Stage0).
 * - Monitora se já existe um processo do orchestrator rodando.
 */

const HEARTBEAT_INTERVAL = 15 * 60 * 1000;
const LOCK_FILE = '.heartbeat.lock';
const LAUNCH_LOG = './launch-calendar.json';

function isOrchestratorRunning(): boolean {
    try {
        // Verifica processos ativos que contenham 'orchestrator.ts'
        const ps = execSync('tasklist /v /fo csv').toString();
        return ps.toLowerCase().includes('orchestrator.ts') || ps.toLowerCase().includes('tsx scripts/');
    } catch (e) {
        // Fallback simplificado para ambientes onde tasklist falha
        return fs.existsSync(LOCK_FILE);
    }
}

function setLock(projectName: string) {
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ project: projectName, startTime: new Date().toISOString() }));
}

function releaseLock() {
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
}

async function pulse() {
    console.log(`\n[HEARTBEAT] Pulso: ${new Date().toISOString()}`);

    if (isOrchestratorRunning()) {
        console.log("[HEARTBEAT] Busy: Já existe uma operação em curso. Pulando este ciclo.");
        return;
    }

    // 1. ANÁLISE DE SAÚDE (Busca por Correções Urgentes)
    try {
        console.log("[HEARTBEAT] Verificando saúde dos projetos...");
        const monitorOutput = execSync('npx tsx scripts/dashboard-monitor.ts').toString();
        
        // Identifica o primeiro projeto crítico no log
        const criticalMatch = monitorOutput.match(/PROJECT: ([\w-]+).*STATUS: CRITICAL/i) || 
                              monitorOutput.match(/GAP DETECTED in ([\w-]+)/i);

        if (criticalMatch) {
            const projectId = criticalMatch[1];
            console.log(`[HEARTBEAT] PRIORIDADE: Correção detectada para [${projectId}]`);
            runTask(`npx tsx scripts/orchestrator.ts --chain=audit --project=${projectId}`, projectId);
            return; // Encerra o pulso após lançar uma tarefa
        }
    } catch (e) {
        console.error("[ERROR] Falha ao rodar dashboard-monitor.");
    }

    // 2. CRIAÇÃO (Se não houver correção, tenta lançamento diário)
    checkDailyLaunch();
}

function checkDailyLaunch() {
    const today = new Date().toISOString().split('T')[0];
    let history: any = {};

    if (fs.existsSync(LAUNCH_LOG)) {
        history = JSON.parse(fs.readFileSync(LAUNCH_LOG, 'utf8'));
    }

    if (!history[today]) {
        const newId = `project-${today}`;
        console.log(`[HEARTBEAT] Nenhuma criação hoje. Iniciando Stage0 para [${newId}]`);
        runTask(`npx tsx scripts/orchestrator.ts --chain=stage0 --project=${newId} --concept="Automated Daily SaaS"`, newId);
        
        history[today] = { launched: true, id: newId, timestamp: new Date().toISOString() };
        fs.writeFileSync(LAUNCH_LOG, JSON.stringify(history, null, 2));
    } else {
        console.log(`[HEARTBEAT] Idle: Projeto do dia (${history[today].id}) já foi processado.`);
    }
}

function runTask(command: string, projectId: string) {
    setLock(projectId);
    console.log(`[EXEC] ${command}`);
    
    // Usamos spawn para não bloquear o event loop do daemon, 
    // embora o intervalo de 15min e o check de processo já protejam.
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { shell: true, stdio: 'inherit' });

    child.on('exit', (code) => {
        console.log(`[HEARTBEAT] Tarefa para [${projectId}] finalizada com código ${code}`);
        releaseLock();
    });
}

// Início do Daemon
console.log("=== CLAUDIO-HARD HEARTBEAT DAEMON ATIVO ===");
console.log(`Intervalo: ${HEARTBEAT_INTERVAL / 1000 / 60} minutos`);
pulse(); 
setInterval(pulse, HEARTBEAT_INTERVAL);
