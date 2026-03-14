import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const HEARTBEAT_INTERVAL = 15 * 60 * 1000; // 15 minutos

async function pulse() {
    console.log(`\n[HEARTBEAT] Iniciando ciclo de monitoramento: ${new Date().toISOString()}`);
    
    // 1. Monitorar Saúde e Escolher o "Paciente" mais crítico
    try {
        const output = execSync('npx tsx scripts/dashboard-monitor.ts').toString();
        console.log(output);

        // Lógica de decisão simples: Se houver "CRITICAL" no log do monitor, age no projeto.
        if (output.includes('CRITICAL') || output.includes('GAP DETECTED')) {
             // Prioriza o Transcritor se estiver com score baixo
             if (output.includes('transcritor')) {
                 console.log("[AUTO-ACTION] Transcritor com saúde baixa. Rodando Auditoria...");
                 // execSync('npx tsx scripts/orchestrator.ts --chain=audit --project=transcritor');
             }
        }
    } catch (e) {
        console.error("[ERROR] Falha no pulso de monitoramento.");
    }

    // 2. Verificar se já lançamos o projeto do dia
    checkDailyLaunch();
}

function checkDailyLaunch() {
    const today = new Date().toISOString().split('T')[0];
    const launchLog = './launch-calendar.json';
    let history = {};

    if (fs.existsSync(launchLog)) {
        history = JSON.parse(fs.readFileSync(launchLog, 'utf8'));
    }

    if (!history[today]) {
        console.log(`[DAILY-LAUNCH] Nenhum projeto lançado hoje (${today}). Iniciando Stage0...`);
        try {
            // Comando para criar novo projeto automaticamente
            const newId = `project-${today}`;
            console.log(`[EXEC] npx tsx scripts/orchestrator.ts --chain=stage0 --project=${newId} --concept="SaaS Automático do Dia"`);
            
            history[today] = { launched: true, id: newId };
            fs.writeFileSync(launchLog, JSON.stringify(history, null, 2));
        } catch (e) {
            console.error("[ERROR] Falha no lançamento diário.");
        }
    } else {
        console.log(`[DAILY-LAUNCH] Projeto do dia já lançado: ${history[today].id}`);
    }
}

// Iniciar Loop
setInterval(pulse, HEARTBEAT_INTERVAL);
pulse(); // Primeiro pulso imediato
