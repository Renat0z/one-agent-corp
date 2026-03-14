import fs from 'fs';
import path from 'path';

const WORKSPACE_DIR = './workspace';

console.log(`[WATCHDOG] Iniciando monitoramento em tempo real de ${WORKSPACE_DIR}...`);

// Função para sincronizar JSON -> Markdown
function syncJsonToMarkdown(projectId: string) {
    const contextPath = path.join(WORKSPACE_DIR, projectId, 'context.json');
    const mdPath = path.join(WORKSPACE_DIR, projectId, 'dashboard-data.md');

    if (!fs.existsSync(contextPath) || !fs.existsSync(mdPath)) return;

    try {
        const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
        let mdContent = fs.readFileSync(mdPath, 'utf8');

        // Extrair dados do snapshot de receita se existirem
        const mrr = context.revenue_snapshot?.mrr || 0;
        const customers = context.revenue_snapshot?.customers || Math.floor(mrr / (context.revenue_snapshot?.price_starter || 1));
        const status = context.status || 'active';

        // Atualizar o frontmatter usando Regex para precisão
        mdContent = mdContent.replace(/customers: \d+/, `customers: ${customers}`);
        mdContent = mdContent.replace(/status: \w+/, `status: ${status}`);
        
        // Se o MRR for atualizado no contexto, podemos logar aqui
        fs.writeFileSync(mdPath, mdContent);
        console.log(`[SYNC] ${projectId}: Markdown atualizado via Watchdog (MRR: ${mrr}).`);
    } catch (e) {
        console.error(`[ERROR] Falha ao sincronizar ${projectId}:`, e);
    }
}

// Observar mudanças na pasta workspace
fs.watch(WORKSPACE_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('context.json')) {
        const projectId = filename.split(path.sep)[0];
        syncJsonToMarkdown(projectId);
    }
});
