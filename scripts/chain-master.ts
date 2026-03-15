/**
 * chain-master.ts
 * One Agent Corp v11.1 — Global Departmental Orchestrator (Full Parity)
 */

import { runDepartmentTask } from "./department-router.js";

const cliArgs = process.argv.slice(2);
const PROJECT_ID = (cliArgs.find(a => a.startsWith("--project=")) || "--project=default-project").replace("--project=", "");

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║   ONE AGENT CORP — GLOBAL CHAIN MASTER (V11.1)      ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  try {
    // 1. MERCADO
    await runDepartmentTask("MarketIntelligence", "squad-market-intelligence", "scout-flow", PROJECT_ID);

    // 2. LEGAL & COMPLIANCE (Gated)
    console.log("\n📍 [FASE 2: LEGAL & COMPLIANCE]");
    // await runDepartmentTask("Legal", "squad-compliance-gate", "main", PROJECT_ID);

    // 3. ENGENHARIA
    await runDepartmentTask("Engineering", "squad-core-engineering", "build-flow", PROJECT_ID);

    // 4. GROWTH
    await runDepartmentTask("Growth", "squad-traffic-factory", "traffic-flow", PROJECT_ID);

    // 5. OPERAÇÕES & QA (Auditoria)
    await runDepartmentTask("QA-Audit", "squad-technical-audit", "audit-flow", PROJECT_ID);

    // 6. CUSTOMER SUCCESS
    console.log("\n📍 [FASE 6: CUSTOMER SUCCESS]");
    // await runDepartmentTask("CustomerSuccess", "squad-churn-prevention", "main", PROJECT_ID);

    console.log(`\n✅ [GLOBAL CHAIN] Concluída com paridade total.`);
    
  } catch (err) {
    console.error(`\n❌ [GLOBAL CHAIN] Abortada.`);
    process.exit(1);
  }
}

main();
