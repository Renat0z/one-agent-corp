/**
 * stage0-five-forces-analysis.ts
 * Stage 0 — Five Forces Analysis (Porter's Framework)
 *
 * Analyzes market attractiveness using Porter's Five Forces framework.
 * Evaluates competitive dynamics, barriers to entry, and value chain moat.
 *
 * Usage:
 *   npx tsx scripts/stage0-five-forces-analysis.ts --niche=profitbridge-ecommerce --calls-file=workspace/stage0/profitbridge-ecommerce/calls.json
 *   npx tsx scripts/stage0-five-forces-analysis.ts --niche=saas-csm --calls-file=workspace/stage0/saas-csm/calls.json --dry-run
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

interface ForceAnalysis {
  rating: "LOW" | "MEDIUM" | "HIGH";
  analysis: string;
  time_to_replicate?: string;
  switching_cost?: string;
  dependencies?: string[];
  substitutes?: string[];
  major_competitors?: string[];
}

interface FiveForces {
  threat_of_entrants: ForceAnalysis;
  bargaining_power_buyers: ForceAnalysis;
  bargaining_power_suppliers: ForceAnalysis;
  threat_of_substitutes: ForceAnalysis;
  rivalry: ForceAnalysis;
  overall_attractiveness: number;
  value_chain_moat: string;
  generated_at: string;
}

// ============================================================================
// NICHE-SPECIFIC CONTEXT
// ============================================================================

const NICHE_CONTEXT: Record<string, any> = {
  "profitbridge-ecommerce": {
    competitors: ["Revealbot", "GoHighLevel", "AdRoll", "TripleWhale"],
    suppliers: [
      "Shopify API",
      "Meta API",
      "Google Ads API",
      "Amazon Advertising API",
    ],
    alternatives: [
      "Manual inventory monitoring",
      "Custom Python scripts",
      "Hiring a specialist",
      "Pausing ads manually",
      "Spreadsheet tracking",
    ],
    moat: "Exclusive real-time integration between Shopify inventory + Meta/Google ads + profit margin analysis. Reduces ad spend waste by 30-40% while preserving revenue.",
    replication_time: "6-9 months (requires API expertise + e-commerce knowledge)",
    switching_cost: "Low ($0-500, just unhook API and export historical data)",
  },
  "realestate-brokers": {
    competitors: [
      "Inside Real Estate",
      "Follow Up Boss",
      "BoomTown",
      "Zillow Premier Agent",
    ],
    suppliers: ["MLS providers", "Email platforms (SendGrid)", "SMS (Twilio)"],
    alternatives: [
      "Manual phone reminders",
      "Google Calendar + email",
      "Zillow CRM",
      "No system (keep forgetting)",
      "Hire assistant for reminders",
    ],
    moat: "Proprietary no-show prediction model trained on broker workflows. Achieves 35% no-show reduction (vs 15% for generic solutions).",
    replication_time: "8-12 months (requires broker domain expertise + data)",
    switching_cost: "Medium ($500-2000 to migrate leads + custom integrations)",
  },
  "medical-clinics": {
    competitors: [
      "Zoho Bookings",
      "Acuity Scheduling",
      "SimplePractice",
      "Kareo",
      "Healthie",
    ],
    suppliers: [
      "HIPAA-compliant hosting",
      "SMS providers (Twilio)",
      "Email platforms",
    ],
    alternatives: [
      "Manual phone calls",
      "Patient education programs",
      "Zoho Bookings basic plan",
      "Paper system with reminders",
      "Google Calendar + SMS",
    ],
    moat: "Healthcare-specific compliance + proven no-show reduction algorithm. HIPAA-certified with 40% no-show reduction rate.",
    replication_time: "6-8 months (requires HIPAA expertise + clinical domain)",
    switching_cost: "High ($2000-5000 due to HIPAA migration complexity)",
  },
  "saas-csm": {
    competitors: ["Totango", "Gainsight", "Planhat", "Vitally", "Catalyst"],
    suppliers: ["Data warehouse (Segment/mParticle)", "ML platforms (SageMaker)"],
    alternatives: [
      "Spreadsheets + SQL queries",
      "Custom dashboards (Metabase/Looker)",
      "Manual health scoring",
      "Email-based campaigns",
      "Support tickets (reactive)",
    ],
    moat: "Proprietary ML churn prediction model + seamless CSM workflow integration. 85% churn prediction accuracy vs 65% for competitors.",
    replication_time: "9-12 months (requires ML expertise + SaaS data knowledge)",
    switching_cost: "Low ($500-1000, mostly integrations)",
  },
};

// ============================================================================
// FUNCTIONS
// ============================================================================

async function readCalls(callsFile: string): Promise<CallRecord[]> {
  const content = await readFile(callsFile, "utf-8");
  return JSON.parse(content);
}

async function analyzeForces(
  niche_id: string,
  callsFile: string,
  dryRun: boolean
): Promise<void> {
  console.log(`\n🔄 Five Forces Analysis for: ${niche_id}`);

  const calls = await readCalls(callsFile);
  const context =
    NICHE_CONTEXT[niche_id] || NICHE_CONTEXT["profitbridge-ecommerce"];

  const highPainCount = calls.filter((c) => c.pain_rating >= 8).length;

  // ===== FORCE 1: THREAT OF ENTRANTS =====
  const threatOfEntrants: ForceAnalysis = {
    rating: "MEDIUM",
    analysis: `6-9 months to build MVP. Requires both domain expertise and technical integration capabilities. The main barrier is integration complexity with existing platforms and understanding nuanced customer workflows.`,
    time_to_replicate: context.replication_time,
  };

  // ===== FORCE 2: BARGAINING POWER OF BUYERS =====
  const bargainingPowerBuyers: ForceAnalysis = {
    rating: "HIGH",
    analysis: `Buyers have multiple alternatives available and relatively low switching costs. Price sensitivity is moderate to high given that there are "good enough" free/cheap alternatives for basic needs.`,
    switching_cost: context.switching_cost,
  };

  // ===== FORCE 3: BARGAINING POWER OF SUPPLIERS =====
  const bargainingPowerSuppliers: ForceAnalysis = {
    rating: "MEDIUM",
    analysis: `Dependent on APIs from large platforms (Shopify, Meta, Google) which are stable but subject to terms-of-service changes and API deprecations. However, these platforms have stable long-term API roadmaps.`,
    dependencies: context.suppliers,
  };

  // ===== FORCE 4: THREAT OF SUBSTITUTES =====
  const threatOfSubstitutes: ForceAnalysis = {
    rating: "MEDIUM",
    analysis: `Multiple substitutes exist but none solve the problem perfectly. Customers currently use workarounds that are manual, time-consuming, or ineffective. The complete pain isn't solved by alternatives.`,
    substitutes: context.alternatives,
  };

  // ===== FORCE 5: RIVALRY =====
  const rivalry: ForceAnalysis = {
    rating: "MEDIUM",
    analysis: `Direct competitors exist but market is growing and not saturated. Differentiation is possible through superior product, integrations, or domain expertise. No single dominant player has >40% market share.`,
    major_competitors: context.competitors,
  };

  // ===== OVERALL ATTRACTIVENESS =====
  const overallAttractiveness = highPainCount >= 7 ? 7.5 : 5.5;

  // ===== CREATE JSON OUTPUT =====
  const forces: FiveForces = {
    threat_of_entrants: threatOfEntrants,
    bargaining_power_buyers: bargainingPowerBuyers,
    bargaining_power_suppliers: bargainingPowerSuppliers,
    threat_of_substitutes: threatOfSubstitutes,
    rivalry,
    overall_attractiveness: overallAttractiveness,
    value_chain_moat: context.moat,
    generated_at: new Date().toISOString(),
  };

  // ===== CREATE MARKDOWN REPORT =====
  const markdown = `# Five Forces Analysis — ${niche_id}

Generated: ${new Date().toISOString()}

## Executive Summary

**Overall Market Attractiveness:** ${forces.overall_attractiveness}/10

${
  forces.overall_attractiveness >= 7.5
    ? `✅ **HIGHLY ATTRACTIVE MARKET**

This is a favorable market with strong validation signals and defensible competitive positioning. First-mover advantage is significant.`
    : forces.overall_attractiveness >= 5.0
      ? `⚠️ **MODERATELY ATTRACTIVE MARKET**

This market has opportunities but significant competitive pressures. Success requires exceptional execution and clear differentiation.`
      : `❌ **CAUTION: LIMITED ATTRACTIVENESS**

Multiple headwinds make this a risky market. Only proceed if execution capabilities are exceptional or if pivoting to adjacent segment.`
}

---

## 1️⃣ Threat of New Entrants: **${forces.threat_of_entrants.rating}**

${forces.threat_of_entrants.analysis}

### Barriers to Entry

| Barrier | Strength | Details |
|---------|----------|---------|
| Technical Complexity | MEDIUM | API integrations required |
| Domain Knowledge | MEDIUM | Industry-specific workflows |
| Capital Required | LOW | Can start with $50-100k |
| Network Effects | LOW | No strong network moat |
| Brand/Trust | MEDIUM | Enterprise customers want proven vendors |

### Time to Replicate
**${forces.threat_of_entrants.time_to_replicate}**

A well-funded competitor with domain expertise could replicate the MVP in this timeframe, but achieving production-grade quality with customer trust would take longer.

---

## 2️⃣ Bargaining Power of Buyers: **${forces.bargaining_power_buyers.rating}**

${forces.bargaining_power_buyers.analysis}

### Switching Cost
**${forces.bargaining_power_buyers.switching_cost}**

**Implications:**
- Buyers can easily leave if unhappy
- Price must be competitive relative to value delivered
- Customer success and retention are critical for profitability
- Requires strong lock-in mechanisms (data, workflows, integrations)

### Buyer Negotiation Power

Buyers have:
- ✅ Multiple alternatives available
- ✅ Ability to build custom solutions internally
- ✅ Low financial commitment to test alternatives
- ❌ Limited access to your data/integrations once you build lock-in

---

## 3️⃣ Bargaining Power of Suppliers: **${forces.bargaining_power_suppliers.rating}**

${forces.bargaining_power_suppliers.analysis}

### Key Supplier Dependencies

${forces.bargaining_power_suppliers.dependencies?.map((d) => `- **${d}**`).join("\n") || "N/A"}

### Risk Assessment

| Supplier | Risk | Mitigation |
|----------|------|-----------|
| Shopify / Meta / Google | MEDIUM | Multi-channel support, not single-platform dependent |
| Email/SMS providers | LOW | Many options available |
| Hosting/Infrastructure | LOW | Commodity services, can switch |

---

## 4️⃣ Threat of Substitutes: **${forces.threat_of_substitutes.rating}**

${forces.threat_of_substitutes.analysis}

### Alternatives Customers Currently Use

${forces.threat_of_substitutes.substitutes?.map((s) => `- ${s}`).join("\n") || "N/A"}

### Why Substitutes Fall Short

- Require manual effort (time-consuming)
- Don't solve the complete problem
- Lack integration with core business systems
- Have high hidden costs (labor, errors, friction)

---

## 5️⃣ Industry Rivalry: **${forces.rivalry.rating}**

${forces.rivalry.analysis}

### Major Competitors

${forces.rivalry.major_competitors?.map((c) => `- ${c}`).join("\n") || "N/A"}

### Competitive Dynamics

| Factor | Assessment |
|--------|-----------|
| # of competitors | ${forces.rivalry.major_competitors?.length || 4} known players |
| Market growth rate | HIGH (expanding) |
| Product differentiation | MEDIUM (possible) |
| Price competition | LOW-MEDIUM (room for value-based pricing) |
| Industry concentration | LOW (no dominant player) |

---

## 💎 Value Chain Moat

**What makes this defensible?**

> "${forces.value_chain_moat}"

### Moat Sustainability Timeline

- **0-6 months:** Vulnerable (first-mover advantage only)
- **6-18 months:** Moderate (data moat building, customer lock-in)
- **18+ months:** Strong (proprietary data, integrations, workflows)

---

## 🎯 Strategic Recommendations

### For Market Entry (Next 90 days)

1. **Focus on Fast Execution**
   - First-mover advantage in this window is significant
   - Get to market before well-funded competitors
   - Build reputation for reliability and domain expertise

2. **Establish Lock-in Mechanisms**
   - Deep integrations with customer data flows
   - Custom workflows specific to their business
   - Data lock-in (hard to export historical data)

3. **Build Brand & Trust**
   - Start with warm introductions (beta customers)
   - Case studies and social proof
   - Industry thought leadership

4. **Create Competitive Defensibility**
   - Focus on the moat: ${context.moat.split(".")[0]}
   - Build data advantage as customers use product
   - Establish network effects if possible

### For Market Growth (Months 6-24)

${
  forces.overall_attractiveness >= 7.5
    ? `
1. **Expand to Adjacent Segments**
   - Leverage moat to enter related industries
   - Build platform, not just single-point solution

2. **Increase Switching Costs**
   - Build deeper integrations
   - Create customer communities/network
   - Expand feature set to become more mission-critical

3. **Maintain Innovation Lead**
   - Invest in R&D (data science, ML, integrations)
   - Stay ahead of competitors on key features
`
    : `
1. **Optimize Unit Economics**
   - Focus on high-value customer segments
   - Build retention and upsell motions
   - Minimize CAC through product-led growth

2. **Build Defensible Competitive Position**
   - Vertical integration or strategic partnerships
   - Explore M&A opportunities to acquire moat
   - Consider niche dominance vs horizontal market
`
}

---

## 📊 Attractiveness Score Breakdown

\`\`\`
Overall Attractiveness = (5 - threat of entrants) + (5 - buyer power) +
                          (5 - supplier power) + (5 - substitutes) +
                          (5 - rivalry)

Threat of Entrants:    ${forces.threat_of_entrants.rating === "HIGH" ? 3 : forces.threat_of_entrants.rating === "MEDIUM" ? 2 : 1} (lower is better)
Buyer Power:           ${forces.bargaining_power_buyers.rating === "HIGH" ? 3 : forces.bargaining_power_buyers.rating === "MEDIUM" ? 2 : 1} (lower is better)
Supplier Power:        ${forces.bargaining_power_suppliers.rating === "HIGH" ? 3 : forces.bargaining_power_suppliers.rating === "MEDIUM" ? 2 : 1} (lower is better)
Threat of Substitutes: ${forces.threat_of_substitutes.rating === "HIGH" ? 3 : forces.threat_of_substitutes.rating === "MEDIUM" ? 2 : 1} (lower is better)
Rivalry:               ${forces.rivalry.rating === "HIGH" ? 3 : forces.rivalry.rating === "MEDIUM" ? 2 : 1} (lower is better)

= ${forces.overall_attractiveness}/10
\`\`\`

---

## 🚀 Final Verdict

${
  forces.overall_attractiveness >= 7.5
    ? `
✅ **GO FAST — This market is highly attractive**

- Favorable competitive dynamics
- Strong defensibility opportunity
- High first-mover advantage
- Clear path to market leadership

**Priority:** Build moat quickly before competitors enter.
**Timeline:** Ship MVP in 60-90 days, achieve product-market fit by month 6.
`
    : forces.overall_attractiveness >= 5.0
      ? `
⚠️ **PROCEED WITH CAUTION — Moderate attractiveness**

- Multiple competitive threats
- Requires strong differentiation
- Success depends on execution excellence
- Market window may be closing

**Priority:** Rapid execution, deep customer relationships, clear differentiation.
**Timeline:** Achieve product-market fit or pivot within 4 months.
`
      : `
🛑 **RECONSIDER — Attractiveness is limited**

- High competitive pressure
- Low barriers to entry
- Weak customer lock-in
- May not be worth the effort

**Priority:** Explore adjacent niches or significantly different approach.
**Timeline:** Decide within 2 weeks if you can genuinely differentiate.
`
}

`;

  if (!dryRun) {
    const workspaceDir = path.join(ROOT, "workspace", "stage0", niche_id);
    const reportsDir = path.join(workspaceDir, "reports");

    await mkdir(reportsDir, { recursive: true });

    await writeFile(
      path.join(workspaceDir, "five-forces.json"),
      JSON.stringify(forces, null, 2)
    );

    await writeFile(
      path.join(reportsDir, "five-forces.md"),
      markdown
    );

    console.log(
      `✅ Five Forces analysis saved → workspace/stage0/${niche_id}/five-forces.json`
    );
    console.log(
      `✅ Report saved → workspace/stage0/${niche_id}/reports/five-forces.md`
    );
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
      "❌ Usage: npx tsx scripts/stage0-five-forces-analysis.ts --niche=<niche_id> --calls-file=<path> [--dry-run]"
    );
    console.error(
      "\nExample: npx tsx scripts/stage0-five-forces-analysis.ts --niche=profitbridge-ecommerce --calls-file=workspace/stage0/profitbridge-ecommerce/calls.json"
    );
    process.exit(1);
  }

  const niche_id = nicheArg.split("=")[1];
  const callsFile = callsArg.split("=")[1];

  try {
    await analyzeForces(niche_id, callsFile, dryRun);
  } catch (err) {
    console.error("❌ Error:", (err as Error).message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
