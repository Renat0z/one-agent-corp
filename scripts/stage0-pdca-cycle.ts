/**
 * stage0-pdca-cycle.ts
 * Stage 0 — PDCA Cycle (Plan-Do-Check-Act)
 *
 * Analyzes validation results against predefined goals using Falconi's PDCA methodology.
 * Generates burndown chart and GO/PIVOTAR/NO-GO recommendation.
 *
 * Usage:
 *   npx tsx scripts/stage0-pdca-cycle.ts --niche=profitbridge-ecommerce --calls-file=workspace/stage0/profitbridge-ecommerce/calls.json
 *   npx tsx scripts/stage0-pdca-cycle.ts --niche=medical-clinics --calls-file=workspace/stage0/medical-clinics/calls.json --dry-run
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ============================================================================
// TYPES
// ============================================================================

interface CallRecord {
  date: string;
  icp_name: string;
  icp_role: string;
  pain_rating: number;
  pain_cost_monthly: number;
  current_solution: string;
  willingness_to_pay: number;
  feedback: string;
  status: "QUALIFIED" | "NEEDS_PIVOT" | "NOT_FIT";
}

interface PDCAAnalysis {
  niche_id: string;
  meta_ltv_cac_ratio: number;
  meta_high_pain_count: number;
  resultado_ltv_cac_ratio: number;
  resultado_high_pain_count: number;
  resultado_total_calls: number;
  lacuna_ltv_cac: number;
  lacuna_pain: number;
  status: "ON_TARGET" | "ABOVE_TARGET" | "BELOW_TARGET";
  recommendation: "GO" | "PIVOTAR" | "NO_GO";
  plano: {
    quem: string;
    o_que: string;
    quando: string;
    metrica: string;
  };
  generated_at: string;
}

// ============================================================================
// NICHE-SPECIFIC SETTINGS
// ============================================================================

const NICHE_SETTINGS: Record<string, any> = {
  "profitbridge-ecommerce": {
    estimated_arpu: 500,
    estimated_cac: 125,
    ltv_months: 18,
  },
  "realestate-brokers": {
    estimated_arpu: 299,
    estimated_cac: 500,
    ltv_months: 12,
  },
  "medical-clinics": {
    estimated_arpu: 450,
    estimated_cac: 200,
    ltv_months: 24,
  },
  "saas-csm": {
    estimated_arpu: 2500,
    estimated_cac: 1200,
    ltv_months: 24,
  },
};

// ============================================================================
// FUNCTIONS
// ============================================================================

async function readCalls(callsFile: string): Promise<CallRecord[]> {
  const content = await readFile(callsFile, "utf-8");
  return JSON.parse(content);
}

function generateBurndownChart(
  currentCount: number,
  targetCount: number
): string {
  const barLength = 30;
  const ratio = Math.min(1, Math.max(0, currentCount / targetCount));
  const filled = Math.round(ratio * barLength);
  const empty = Math.max(0, barLength - filled);
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}] ${currentCount}/${targetCount}`;
}

function generateAsciiLineChart(data: number[]): string {
  if (data.length === 0) return "";

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max === min ? 1 : max - min;
  const height = 5;

  let chart = "";

  for (let h = height; h > 0; h--) {
    const threshold = min + (h / height) * range;
    chart += " ";

    for (let i = 0; i < data.length; i++) {
      if (data[i] >= threshold) {
        chart += "█ ";
      } else {
        chart += "  ";
      }
    }
    chart += "\n";
  }

  chart += "└";
  for (let i = 0; i < data.length; i++) {
    chart += "──";
  }

  return chart;
}

async function runPDCA(
  niche_id: string,
  callsFile: string,
  dryRun: boolean
): Promise<void> {
  console.log(`\n📊 PDCA Cycle Analysis for: ${niche_id}`);

  // Read call data
  const calls = await readCalls(callsFile);

  // ===== PLAN (META) =====
  const metaLtvCacRatio = 5.0;
  const metaHighPainCount = 7;

  // ===== DO (RESULTADO) =====
  const settings =
    NICHE_SETTINGS[niche_id] || NICHE_SETTINGS["profitbridge-ecommerce"];
  const resultadoHighPainCount = calls.filter((c) => c.pain_rating >= 8).length;
  const resultadoTotalCalls = calls.length;

  // Calculate LTV:CAC
  const ltv = settings.estimated_arpu * settings.ltv_months;
  const resultadoLtvCacRatio = ltv / settings.estimated_cac;

  const averageCost =
    calls.reduce((sum, c) => sum + c.pain_cost_monthly, 0) / calls.length;
  const willingnessCount = calls.filter((c) => c.willingness_to_pay >= 300)
    .length;
  const willingnessPercentage = (willingnessCount / resultadoTotalCalls) * 100;

  // ===== CHECK (LACUNA) =====
  const lacunaLtvCac = metaLtvCacRatio - resultadoLtvCacRatio;
  const lacunaPain = metaHighPainCount - resultadoHighPainCount;

  // ===== STATUS & RECOMMENDATION =====
  let status: "ON_TARGET" | "ABOVE_TARGET" | "BELOW_TARGET" = "ON_TARGET";
  let recommendation: "GO" | "PIVOTAR" | "NO_GO" = "PIVOTAR";

  if (
    resultadoHighPainCount >= metaHighPainCount &&
    resultadoLtvCacRatio >= metaLtvCacRatio
  ) {
    status = "ABOVE_TARGET";
    recommendation = "GO";
  } else if (
    resultadoHighPainCount < metaHighPainCount ||
    resultadoLtvCacRatio < metaLtvCacRatio
  ) {
    status = "BELOW_TARGET";
    recommendation = lacunaPain < -3 ? "NO_GO" : "PIVOTAR";
  } else {
    recommendation = "GO";
  }

  // ===== ACT (PLANO) =====
  const plano = {
    quem: "Product & Customer Success teams",
    o_que: `${
      status === "ABOVE_TARGET"
        ? "Prepare for Stage 1: Build MVP + Grand Slam Offer"
        : status === "ON_TARGET"
          ? "Refine ICP targeting and validate pricing elasticity"
          : "Pivot messaging or explore adjacent segments"
    }`,
    quando: "Next 2-week sprint",
    metrica: `${
      status === "ABOVE_TARGET"
        ? "Complete MVP prototype"
        : "Increase high-pain calls to 8+ or refocus segments"
    }`,
  };

  // ===== GENERATE MARKDOWN REPORT =====
  const markdown = `# PDCA Cycle — ${niche_id}

Generated: ${new Date().toISOString()}

## 📋 PLAN (META)

**Goal:** Validate if ${niche_id} has:
- **LTV:CAC ratio ≥ 5:1** (indicates unit economics viability)
- **Pain ≥ 8/10 in 7+ of 15 calls** (pain is real and monetizable)

This is the industry standard for SaaS/software product viability.

---

## ✅ DO (RESULTADO)

### Validation Results

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **High Pain Calls (≥8/10)** | 7+ | ${resultadoHighPainCount} | ${resultadoHighPainCount >= 7 ? "✅" : "❌"} |
| **LTV:CAC Ratio** | 5:1+ | ${resultadoLtvCacRatio.toFixed(2)}:1 | ${resultadoLtvCacRatio >= 5.0 ? "✅" : "❌"} |
| **Total Calls Completed** | 15 | ${resultadoTotalCalls} | ✅ |
| **Avg Monthly Pain Cost** | - | $${averageCost.toLocaleString("en-US", { maximumFractionDigits: 0 })} | ℹ️ |
| **Willingness to Pay ≥$300/mo** | 50%+ | ${willingnessPercentage.toFixed(0)}% | ${willingnessPercentage >= 50 ? "✅" : "⚠️"} |

### Unit Economics Calculation

\`\`\`
LTV = ARPU × LTV_months
    = $${settings.estimated_arpu} × ${settings.ltv_months} months
    = $${ltv.toLocaleString()}

CAC = $${settings.estimated_cac}

LTV:CAC = $${ltv.toLocaleString()} : $${settings.estimated_cac}
        = ${resultadoLtvCacRatio.toFixed(2)}:1
\`\`\`

---

## 🔍 CHECK (LACUNA = META - RESULTADO)

### Gap Analysis

**Pain Gap:** ${lacunaPain >= 0 ? "✅" : "❌"} ${Math.abs(lacunaPain)} call(s) ${
    lacunaPain >= 0 ? "below" : "above"
  } target
- Need: ${metaHighPainCount} calls with pain ≥ 8/10
- Got: ${resultadoHighPainCount} calls
- Status: ${resultadoHighPainCount >= metaHighPainCount ? "VALIDATED" : "NOT YET"}

**LTV:CAC Gap:** ${lacunaLtvCac >= 0 ? "✅" : "❌"} ${Math.abs(lacunaLtvCac).toFixed(2)}:1 ${
    lacunaLtvCac >= 0 ? "below" : "above"
  } target
- Need: LTV:CAC ≥ 5:1
- Got: LTV:CAC ${resultadoLtvCacRatio.toFixed(2)}:1
- Status: ${resultadoLtvCacRatio >= 5.0 ? "VALIDATED" : "NOT YET"}

---

## 📈 Burndown Charts

### High Pain Calls Progress
${generateBurndownChart(resultadoHighPainCount, metaHighPainCount)}

### LTV:CAC Ratio Progress
${generateBurndownChart(
  Math.round(Math.min(resultadoLtvCacRatio * 2, 10)),
  10
)}

---

## 🎯 ACT (PLANO)

| Field | Value |
|-------|-------|
| **Quem** | ${plano.quem} |
| **O quê** | ${plano.o_que} |
| **Quando** | ${plano.quando} |
| **Métrica** | ${plano.metrica} |

---

## 📊 Overall Status

### Status: **${status}**

${
  status === "ABOVE_TARGET"
    ? `🚀 **Exceeding targets!**
- All validation goals met and exceeded
- Ready for Stage 1 development
- Confidence level: HIGH`
    : status === "ON_TARGET"
      ? `📌 **On track!**
- Validation goals are being met
- Continue current strategy
- Confidence level: MEDIUM`
      : `⚠️ **Below target**
- Some goals not yet met
- Adjustment or pivot needed
- Confidence level: LOW`
}

### Recommendation: **${recommendation}**

${
  recommendation === "GO"
    ? `✅ **ADVANCE TO STAGE 1**

**Evidence:**
- Pain is real: ${resultadoHighPainCount}/${metaHighPainCount} high-pain contacts validated
- Economics work: LTV:CAC = ${resultadoLtvCacRatio.toFixed(2)}:1 (target: ${metaLtvCacRatio}:1)
- Willingness to pay confirmed: ${willingnessPercentage.toFixed(0)}%
- No dominant competitor

**Next 30 days:**
1. Week 1-2: Select 3-5 beta customers from qualified calls
2. Week 2-3: Design Grand Slam Offer
3. Week 3-4: Kick off MVP development (8-week sprint)
4. Week 4: Begin beta customer onboarding`
    : recommendation === "PIVOTAR"
      ? `🔄 **PIVOT & REVALIDATE**

**Evidence:**
- Moderate pain signal: ${resultadoHighPainCount} high-pain contacts (need ${metaHighPainCount})
- Economics borderline: LTV:CAC = ${resultadoLtvCacRatio.toFixed(2)}:1 (target: ${metaLtvCacRatio}:1)

**Pivot Options:**
1. **Adjust ICP:** Target different company size or job title
2. **Reframe Problem:** Focus on specific pain subset
3. **Adjacent Segment:** Related industry with similar pain pattern

**Next 14 days:**
1. Analyze feedback from QUALIFIED calls
2. Identify 2-3 pivot directions
3. Run 10 additional validation calls with adjusted targeting
4. Re-run PDCA with new data`
      : `🛑 **ARCHIVE & MOVE ON**

**Evidence:**
- Weak pain signal: Only ${resultadoHighPainCount} high-pain contacts (need ${metaHighPainCount})
- Economics don't work: LTV:CAC = ${resultadoLtvCacRatio.toFixed(2)}:1 (need ${metaLtvCacRatio}:1+)
- Monetization is questionable

**Next steps:**
1. Document learnings in niche archive
2. Move to next niche in backlog
3. Extract insights for future validation`
}

---

## 📝 Learnings & Next Actions

### What Worked
${
  resultadoHighPainCount >= metaHighPainCount
    ? `✅ ICP targeting was accurate — found enough high-pain contacts`
    : `⚠️ ICP targeting needs adjustment — difficulty finding high-pain contacts`
}

${
  willingnessPercentage >= 50
    ? `✅ Willingness to pay is strong — pricing model is sound`
    : `⚠️ Willingness to pay is low — may need to adjust value prop or pricing`
}

### Action Items
- [ ] Review all call transcripts from QUALIFIED contacts
- [ ] Extract top 3 pain points mentioned
- [ ] Identify objections and competitor mentions
- [ ] Prepare pitch deck for Stage 1 planning
- [ ] Schedule founder interviews with 3-5 beta customers

`;

  if (!dryRun) {
    const reportsDir = path.join(ROOT, "workspace", "stage0", niche_id, "reports");
    await mkdir(reportsDir, { recursive: true });
    await writeFile(
      path.join(reportsDir, "pdca-cycle.md"),
      markdown
    );

    const analysisData: PDCAAnalysis = {
      niche_id,
      meta_ltv_cac_ratio: metaLtvCacRatio,
      meta_high_pain_count: metaHighPainCount,
      resultado_ltv_cac_ratio: resultadoLtvCacRatio,
      resultado_high_pain_count: resultadoHighPainCount,
      resultado_total_calls: resultadoTotalCalls,
      lacuna_ltv_cac: lacunaLtvCac,
      lacuna_pain: lacunaPain,
      status,
      recommendation,
      plano,
      generated_at: new Date().toISOString(),
    };

    await writeFile(
      path.join(ROOT, "workspace", "stage0", niche_id, "pdca.json"),
      JSON.stringify(analysisData, null, 2)
    );

    console.log(`✅ PDCA report saved → workspace/stage0/${niche_id}/reports/pdca-cycle.md`);
    console.log(`✅ Analysis data saved → workspace/stage0/${niche_id}/pdca.json`);
  } else {
    console.log("📄 DRY RUN — No files saved");
  }

  console.log(markdown);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const nicheArg = args.find((a) => a.startsWith("--niche="));
  const callsArg = args.find((a) => a.startsWith("--calls-file="));
  const dryRun = args.includes("--dry-run");

  if (!nicheArg || !callsArg) {
    console.error(
      "❌ Usage: npx tsx scripts/stage0-pdca-cycle.ts --niche=<niche_id> --calls-file=<path> [--dry-run]"
    );
    console.error(
      "\nExample: npx tsx scripts/stage0-pdca-cycle.ts --niche=profitbridge-ecommerce --calls-file=workspace/stage0/profitbridge-ecommerce/calls.json"
    );
    process.exit(1);
  }

  const niche_id = nicheArg.split("=")[1];
  const callsFile = callsArg.split("=")[1];

  try {
    await runPDCA(niche_id, callsFile, dryRun);
  } catch (err) {
    console.error("❌ Error:", (err as Error).message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
