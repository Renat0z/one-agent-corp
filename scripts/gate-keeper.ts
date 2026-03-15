import fs from 'fs';
import path from 'path';

/**
 * IDENTITY: GATE-KEEPER (Inspirado no Quinn do AIOX)
 * OBJETIVO: Auditar outputs dos departamentos para evitar respostas superficiais.
 */

interface AuditResult {
  passed: boolean;
  score: number;
  critique: string[];
  suggestions: string[];
}

export class GateKeeper {
  private projectPath: string;

  constructor(projectId: string) {
    this.projectPath = path.join(process.cwd(), 'workspace', projectId);
  }

  public auditFile(filePath: string, minDataPoints: number = 5): AuditResult {
    const fullPath = path.join(this.projectPath, filePath);
    if (!fs.existsSync(fullPath)) {
      return { passed: false, score: 0, critique: ['Arquivo não encontrado'], suggestions: ['Certifique-se que o script anterior rodou'] };
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const critique: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. Verificação de Densidade de Dados (Números, %, $, [ ], unidades técnicas)
    const dataPoints = (content.match(/(\d+%|\$\d+|\[.*\]|\d+\.\d+|\d+\s*ms|\d+\s*unidades|SLA\s*\d+)/gi) || []).length;
    if (dataPoints < minDataPoints) {
      score -= 40;
      critique.push(`Baixa densidade de dados técnicos (${dataPoints} encontrados, mínimo ${minDataPoints}).`);
      suggestions.push('Extraia métricas reais, preços, percentuais de conversão ou IDs de referência.');
    }

    // 2. Verificação de Clichês (Termos superficiais)
    const cliches = ['potencial incrível', 'melhores práticas', 'solução inovadora', 'focar no cliente'];
    cliches.forEach(cliche => {
      if (content.toLowerCase().includes(cliche)) {
        score -= 10;
        critique.push(`Uso de termo superficial: "${cliche}"`);
      }
    });

    // 3. Verificação de Estrutura (Markdown)
    if (!content.includes('##') || !content.includes('- ')) {
      score -= 20;
      critique.push('Estrutura Markdown pobre ou inexistente.');
      suggestions.push('Use subtítulos, listas técnicas e tabelas para organizar a informação.');

    }

    return {
      passed: score >= 70,
      score,
      critique,
      suggestions
    };
  }

  public logAudit(reportName: string, result: AuditResult) {
    const logPath = path.join(this.projectPath, 'audit-log.json');
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    }
    logs.push({
      timestamp: new Date().toISOString(),
      report: reportName,
      ...result
    });
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    
    if (!result.passed) {
      console.error(`\n❌ [GATE-KEEPER] FALHA DE QUALIDADE EM: ${reportName}`);
      console.error(`Score: ${result.score}/100`);
      result.critique.forEach(c => console.error(` - ${c}`));
      console.log(`💡 Sugestões: ${result.suggestions.join(' | ')}\n`);
    } else {
      console.log(`\n✅ [GATE-KEEPER] QUALIDADE APROVADA: ${reportName} (Score: ${result.score})\n`);
    }
  }
}
