import { readdir, readFile } from 'fs/promises';
import path from 'path';

async function consultCouncil(topic: string, domain: string) {
  console.log(`🏛️ CONVOCANDO O CONSELHO DAS MENTES PARA: ${topic}\n`);
  
  const mindsDir = "C:/Users/Administrador/.claude/minds/";
  const experts = {
    'business': ['michael_porter', 'eliyahu_goldratt'],
    'product': ['eric_ries', 'marty_cagan'],
    'marketing': ['alex_hormozi', 'al_ries']
  }[domain] || [];

  for (const expert of experts) {
    const heuristicPath = path.join(mindsDir, expert, 'heuristics');
    try {
      const files = await readdir(heuristicPath);
      console.log(`👤 Mente: ${expert.toUpperCase()}`);
      for (const file of files) {
        const content = await readFile(path.join(heuristicPath, file), 'utf-8');
        console.log(`   - Heurística: ${file}`);
        // Aqui o sistema processaria o conteúdo para ajustar o plano
      }
    } catch (e) {
      console.warn(`⚠️ Erro ao consultar expert ${expert}`);
    }
  }
}

consultCouncil("ProfitBridge Trust Gap", "product");
