/**
 * stage0-pre-validated-niches.ts
 * Stage 0 — Pre-Validated Niches Database
 *
 * Maintains a structured database of 4 pre-validated niches with:
 * - ICP definition, pain points, competitors
 * - Distribution channels & CAC estimates
 * - Unit economics (LTV:CAC ratio)
 * - Five Forces indicators
 *
 * Usage:
 *   npx tsx scripts/stage0-pre-validated-niches.ts --list
 *   npx tsx scripts/stage0-pre-validated-niches.ts --id=profitbridge-ecommerce
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

interface Competitor {
  name: string;
  pricing_per_month: number;
  primary_feature: string;
  weakness: string;
}

interface Pain {
  description: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  cost_per_month: number;
  sources: string[];
}

interface ICP {
  title: string;
  company_size: string;
  industry: string;
}

interface Distribution {
  primary_channel: string;
  secondary_channels: string[];
  cac_estimated: number;
}

interface UnitEconomics {
  arpu: number;
  ltv_months: number;
  ltv_total: number;
  ltv_cac_ratio: number;
}

interface FiveForces {
  threat_of_entrants: "LOW" | "MEDIUM" | "HIGH";
  bargaining_power_buyers: "LOW" | "MEDIUM" | "HIGH";
  bargaining_power_suppliers: "LOW" | "MEDIUM" | "HIGH";
  threat_of_substitutes: "LOW" | "MEDIUM" | "HIGH";
  rivalry: "LOW" | "MEDIUM" | "HIGH";
  overall_attractiveness: number;
}

interface ValidatedNiche {
  id: string;
  name: string;
  icp: ICP;
  pain: Pain;
  competitors: Competitor[];
  distribution: Distribution;
  unit_economics: UnitEconomics;
  validation_score: number;
  five_forces: FiveForces;
}

// ============================================================================
// DATA: 4 PRE-VALIDATED NICHES
// ============================================================================

const NICHES: ValidatedNiche[] = [
  {
    id: "profitbridge-ecommerce",
    name: "ProfitBridge — Shopify E-Commerce Profitability",
    icp: {
      title: "Shopify Store Owner / Performance Marketer",
      company_size: "10-500 employees",
      industry: "E-Commerce",
    },
    pain: {
      description:
        "Loss of profit when inventory runs out during ad campaigns, overspending on ads for out-of-stock products",
      frequency: "DAILY",
      cost_per_month: 2847,
      sources: ["15 validated customer calls", "Shopify trends Q1 2026"],
    },
    competitors: [
      {
        name: "Revealbot",
        pricing_per_month: 299,
        primary_feature: "Campaign automation",
        weakness: "Does not integrate inventory data",
      },
      {
        name: "GoHighLevel",
        pricing_per_month: 497,
        primary_feature: "Marketing suite",
        weakness: "SMS-focused, not e-commerce optimized",
      },
      {
        name: "TripleWhale",
        pricing_per_month: 249,
        primary_feature: "Analytics dashboard",
        weakness: "No active campaign management",
      },
    ],
    distribution: {
      primary_channel: "Shopify App Store",
      secondary_channels: ["Facebook groups", "YouTube ads", "LinkedIn"],
      cac_estimated: 125,
    },
    unit_economics: {
      arpu: 500,
      ltv_months: 18,
      ltv_total: 9000,
      ltv_cac_ratio: 6.2,
    },
    validation_score: 9.2,
    five_forces: {
      threat_of_entrants: "MEDIUM",
      bargaining_power_buyers: "HIGH",
      bargaining_power_suppliers: "MEDIUM",
      threat_of_substitutes: "MEDIUM",
      rivalry: "MEDIUM",
      overall_attractiveness: 7,
    },
  },
  {
    id: "realestate-brokers",
    name: "ShowUp — Real Estate No-Show Prevention",
    icp: {
      title: "Real Estate Broker / Team Lead",
      company_size: "5-100 agents",
      industry: "Real Estate",
    },
    pain: {
      description:
        "No-shows cost 15-20% of commissions, causing team frustration and lost revenue",
      frequency: "WEEKLY",
      cost_per_month: 1500,
      sources: ["12 broker validation calls", "Real estate industry reports"],
    },
    competitors: [
      {
        name: "Inside Real Estate",
        pricing_per_month: 199,
        primary_feature: "Basic CRM",
        weakness: "No automatic reminders",
      },
      {
        name: "Follow Up Boss",
        pricing_per_month: 99,
        primary_feature: "Lead management",
        weakness: "Does not predict no-show risk",
      },
    ],
    distribution: {
      primary_channel: "B2B sales (direct to brokers)",
      secondary_channels: ["Zillow integration", "Broker networks"],
      cac_estimated: 500,
    },
    unit_economics: {
      arpu: 299,
      ltv_months: 12,
      ltv_total: 3588,
      ltv_cac_ratio: 2.1,
    },
    validation_score: 6.8,
    five_forces: {
      threat_of_entrants: "HIGH",
      bargaining_power_buyers: "MEDIUM",
      bargaining_power_suppliers: "MEDIUM",
      threat_of_substitutes: "HIGH",
      rivalry: "HIGH",
      overall_attractiveness: 4,
    },
  },
  {
    id: "medical-clinics",
    name: "MediShow — Medical Clinic Appointment No-Show Reduction",
    icp: {
      title: "Clinic Manager / Receptionist Supervisor",
      company_size: "10-50 employees",
      industry: "Healthcare",
    },
    pain: {
      description: "No-shows cost ~8% of monthly revenue and disrupt scheduling",
      frequency: "DAILY",
      cost_per_month: 3200,
      sources: ["10 clinic manager calls", "Healthcare industry benchmarks"],
    },
    competitors: [
      {
        name: "Zoho Bookings",
        pricing_per_month: 40,
        primary_feature: "Appointment scheduling",
        weakness: "Basic reminders, no ML-driven optimization",
      },
      {
        name: "Acuity Scheduling",
        pricing_per_month: 15,
        primary_feature: "Calendar sync",
        weakness: "No predictive no-show analysis",
      },
      {
        name: "SimplePractice",
        pricing_per_month: 200,
        primary_feature: "EHR + scheduling",
        weakness: "No-show prevention is secondary feature",
      },
    ],
    distribution: {
      primary_channel: "Medical software marketplace",
      secondary_channels: ["Direct sales", "Healthcare associations"],
      cac_estimated: 200,
    },
    unit_economics: {
      arpu: 450,
      ltv_months: 24,
      ltv_total: 10800,
      ltv_cac_ratio: 4.5,
    },
    validation_score: 8.5,
    five_forces: {
      threat_of_entrants: "LOW",
      bargaining_power_buyers: "MEDIUM",
      bargaining_power_suppliers: "LOW",
      threat_of_substitutes: "MEDIUM",
      rivalry: "MEDIUM",
      overall_attractiveness: 7.5,
    },
  },
  {
    id: "saas-csm",
    name: "ChurnShield — SaaS Customer Success Churn Prevention",
    icp: {
      title: "Customer Success Manager / Head of CS",
      company_size: "20-200 employees",
      industry: "SaaS",
    },
    pain: {
      description:
        "5% monthly churn = $50k/month MRR lost (for 1M ARR business). Each point of churn costs 20k+ annually",
      frequency: "DAILY",
      cost_per_month: 50000,
      sources: ["8 SaaS CS calls", "Totango/Gainsight benchmarks"],
    },
    competitors: [
      {
        name: "Totango",
        pricing_per_month: 3000,
        primary_feature: "Health score + automation",
        weakness: "Expensive, requires complex implementation",
      },
      {
        name: "Gainsight",
        pricing_per_month: 5000,
        primary_feature: "Predictive churn + customer intelligence",
        weakness: "Enterprise-focused, overcomplicated for SMBs",
      },
      {
        name: "Planhat",
        pricing_per_month: 2000,
        primary_feature: "CSM workspace + health scoring",
        weakness: "Limited predictive capability",
      },
    ],
    distribution: {
      primary_channel: "SaaS marketplaces (AppSumo, Capterra)",
      secondary_channels: ["Direct sales", "SaaS communities"],
      cac_estimated: 1200,
    },
    unit_economics: {
      arpu: 2500,
      ltv_months: 24,
      ltv_total: 60000,
      ltv_cac_ratio: 5.0,
    },
    validation_score: 9.0,
    five_forces: {
      threat_of_entrants: "LOW",
      bargaining_power_buyers: "MEDIUM",
      bargaining_power_suppliers: "MEDIUM",
      threat_of_substitutes: "MEDIUM",
      rivalry: "MEDIUM",
      overall_attractiveness: 8,
    },
  },
];

// ============================================================================
// FUNCTIONS
// ============================================================================

async function listNiches(): Promise<void> {
  console.log("\n📋 Stage 0 — Pre-Validated Niches\n");
  console.log(
    "| ID | Name | Score | ICP | Pain/month | LTV:CAC |"
  );
  console.log("|---|---|---|---|---|---|");

  for (const niche of NICHES) {
    const ltv = niche.unit_economics.ltv_cac_ratio;
    console.log(
      `| ${niche.id} | ${niche.name} | ${niche.validation_score}/10 | ${niche.icp.title} | $${niche.pain.cost_per_month.toLocaleString()} | ${ltv.toFixed(1)}:1 |`
    );
  }
  console.log("");
}

async function getNicheById(id: string): Promise<ValidatedNiche | null> {
  return NICHES.find((n) => n.id === id) || null;
}

async function updateValidationScore(
  id: string,
  calls: number,
  score: number
): Promise<void> {
  const niche = NICHES.find((n) => n.id === id);
  if (!niche) {
    console.error(`❌ Niche ${id} not found`);
    return;
  }
  niche.validation_score = Math.min(10, Math.max(0, score));
  console.log(
    `✅ Updated validation score → ${id}: ${score}/10 (based on ${calls} calls)`
  );
}

async function saveNichesToWorkspace(): Promise<void> {
  const workspaceRoot = path.join(ROOT, "workspace", "stage0");

  for (const niche of NICHES) {
    const nicheDir = path.join(workspaceRoot, niche.id);
    await mkdir(nicheDir, { recursive: true });

    await writeFile(
      path.join(nicheDir, "niche.json"),
      JSON.stringify(niche, null, 2)
    );

    console.log(
      `✅ Saved niche data → workspace/stage0/${niche.id}/niche.json`
    );
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const listFlag = args.includes("--list");
  const idArg = args.find((a) => a.startsWith("--id="));
  const id = idArg ? idArg.split("=")[1] : null;

  if (listFlag) {
    await listNiches();
  } else if (id) {
    const niche = await getNicheById(id);
    if (niche) {
      console.log("\n📌 Niche Details:\n");
      console.log(JSON.stringify(niche, null, 2));

      // Also save to workspace
      const nicheDir = path.join(ROOT, "workspace", "stage0", id);
      await mkdir(nicheDir, { recursive: true });
      await writeFile(
        path.join(nicheDir, "niche.json"),
        JSON.stringify(niche, null, 2)
      );
      console.log(`\n✅ Saved to workspace/stage0/${id}/niche.json`);
    } else {
      console.error(`❌ Niche ${id} not found`);
      process.exit(1);
    }
  } else {
    console.log(
      "Usage: npx tsx scripts/stage0-pre-validated-niches.ts [--list | --id=<niche_id>]"
    );
    console.log("\nDefault action: Saving all niches to workspace/stage0/");
    await saveNichesToWorkspace();
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
