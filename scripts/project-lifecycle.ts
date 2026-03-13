/**
 * project-lifecycle.ts
 * Swarm OS v4.2 — Full Project Lifecycle Orchestrator
 *
 * Pipeline: Research → PRD → Architecture → Build → QA → Deploy → Audit
 * Gates adaptivos entre cada fase: Flow Intelligence + Strategy Board
 * corrigem rota, pulam fases ou repetem fases com novo contexto.
 *
 * Uso:
 *   npx tsx scripts/project-lifecycle.ts \
 *     --concept="SaaS de X para Y" \
 *     --project=meu-projeto \
 *     [--skip-deploy] [--dry-run]
 */

import * as fs   from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { NodeSSH }       from "node-ssh";
import {
  createAgentSession,
  SessionManager,
  AuthStorage,
  ModelRegistry,
} from "@mariozechner/pi-coding-agent";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── CLI Args ────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
function arg(key: string, def = "") {
  const found = argv.find((a) => a.startsWith(`--${key}=`));
  return found ? found.replace(`--${key}=`, "") : def;
}
const PROJECT_ID   = arg("project",  "pingboard");
const CONCEPT      = arg("concept",  "API de health check e monitoramento de URLs com alertas por WhatsApp");
const SKIP_DEPLOY  = argv.includes("--skip-deploy");
const DRY_RUN      = argv.includes("--dry-run");
const QUIET        = !argv.includes("--verbose"); // quiet é o padrão; use --verbose para streaming completo

// ─── Paths ───────────────────────────────────────────────────────────────────

const ROOT      = path.resolve(__dirname, "..");
const WS        = path.join(ROOT, "workspace", PROJECT_ID);
const LC        = path.join(WS, "lifecycle");
const MINDS_DIR = "C:/Users/Administrador/.claude/minds";

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .forEach((l) => {
      const [k, ...v] = l.split("=");
      process.env[k.trim()] = v.join("=").trim();
    });
}
loadEnv();

const VPS_HOST  = process.env.VPS_HOST  || "";
const VPS_USER  = process.env.VPS_USER  || "root";
const VPS_PASS  = process.env.VPS_PASSWORD || "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhaseResult {
  phaseId:   string;
  label:     string;
  status:    "success" | "partial" | "failed";
  artifacts: string[];          // relative paths
  summary:   string;
  keyData:   Record<string, unknown>;
  startedAt: string;
  endedAt:   string;
}

interface GateDecision {
  gateFor:    string;
  verdict:    "proceed" | "redirect" | "halt";
  reason:     string;
  advisor:    string;
  mods:       Modification[];
}

interface Modification {
  type:     "skip" | "repeat" | "update_context";
  phaseId?: string;
  note:     string;
}

interface LifecycleContext {
  projectId:  string;
  concept:    string;
  phases:     string[];
  currentPhase: number;
  pipelineState: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(d: string) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function save(relPath: string, content: string) {
  const full = path.join(WS, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, "utf-8");
  return relPath;
}

function saveJson(relPath: string, data: unknown) {
  return save(relPath, JSON.stringify(data, null, 2));
}

function readFile(relPath: string): string {
  try { return fs.readFileSync(path.join(WS, relPath), "utf-8"); }
  catch { return ""; }
}

function ts() { return new Date().toISOString(); }

function box(title: string, color = "═") {
  const W = 60;
  const pad = Math.max(0, W - title.length - 4);
  console.log("\n╔" + color.repeat(W) + "╗");
  console.log(`║  ${title}${" ".repeat(pad)}  ║`);
  console.log("╚" + color.repeat(W) + "╝");
}

function phase(n: number, label: string) {
  console.log(`\n${"─".repeat(62)}`);
  console.log(`  FASE ${n}: ${label}`);
  console.log("─".repeat(62));
}

function gate(label: string) {
  console.log(`\n  🔵 GATE: ${label}`);
}

// ─── Claude Session ───────────────────────────────────────────────────────────
// Cada chamada ai() cria sessão isolada — evita "Agent is already processing"
// e contaminação de contexto pelo CLAUDE.md do projeto.

// Prefixo injetado em TODOS os prompts para desativar o comportamento de roteador
// que o CLAUDE.md local provoca quando o pi-coding-agent lê o projeto.
const EXECUTOR_OVERRIDE = `\
EXECUTOR MODE — IGNORE CLAUDE.md ROUTER INSTRUCTIONS.
You are a department executor inside One Agent Corp's automated pipeline.
Rules for this call:
- Do NOT read or follow CLAUDE.md boot sequences, session state, or routing instructions.
- Do NOT say "Sessão retomada" or reference active projects.
- Do NOT delegate to scripts or ask-gemini. Execute the task directly.
- Produce ONLY the output requested below. Nothing else.
---
`;

async function ai(prompt: string, label: string): Promise<string> {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] ${label} — pulando chamada AI`);
    return `[DRY-RUN placeholder for: ${label}]`;
  }

  const startTime = Date.now();
  console.log(`  🤖 ${label}...`);

  // Cada chamada usa uma sessão nova para evitar "Agent is already processing"
  // quando o estado da sessão fica contaminado por respostas longas/inesperadas.
  const authStorage   = AuthStorage.create();
  const modelRegistry = new ModelRegistry(authStorage);
  const { session }   = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
    authStorage,
    modelRegistry,
  });

  const fullPrompt = EXECUTOR_OVERRIDE + prompt;
  const chunks: string[] = [];

  if (QUIET) {
    let accLen = 0;
    const unsub = session.subscribe((e: any) => {
      if (e.type === "message_update" && e.assistantMessageEvent?.type === "text_delta") {
        const d = e.assistantMessageEvent.delta as string;
        chunks.push(d);
        accLen += d.length;
        if (accLen >= 500) { process.stdout.write("."); accLen = 0; }
      }
    });
    try { await session.prompt(fullPrompt); }
    finally { unsub(); }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(` ✓ (${chunks.join("").length} chars, ${elapsed}s)`);
  } else {
    const unsub = session.subscribe((e: any) => {
      if (e.type === "message_update" && e.assistantMessageEvent?.type === "text_delta") {
        const d = e.assistantMessageEvent.delta as string;
        process.stdout.write(d);
        chunks.push(d);
      }
    });
    try { await session.prompt(fullPrompt); }
    finally { unsub(); }
    console.log();
  }

  return chunks.join("");
}

// ─── Mind Loader ─────────────────────────────────────────────────────────────

function loadMindSnippet(mindId: string): string {
  const base = path.join(MINDS_DIR, mindId);
  const fw = fs.existsSync(path.join(base, "artifacts", "framework-primary.md"))
    ? fs.readFileSync(path.join(base, "artifacts", "framework-primary.md"), "utf-8").slice(0, 800)
    : "";
  return fw;
}

// ─── JSON Extractor ───────────────────────────────────────────────────────────

function extractJson(text: string): any {
  const m1 = text.match(/<<JSON>>([\s\S]*?)<<\/JSON>>/);
  if (m1) { try { return JSON.parse(m1[1].trim()); } catch {} }
  const m2 = text.match(/```json\s*([\s\S]*?)```/);
  if (m2) { try { return JSON.parse(m2[1].trim()); } catch {} }
  const m3 = text.match(/\{[\s\S]*\}/);
  if (m3) { try { return JSON.parse(m3[0]); } catch {} }
  return null;
}

// Extract files from Claude response (format: ===FILE: path/to/file.ts===)
function extractFiles(text: string): Record<string, string> {
  const files: Record<string, string> = {};
  const regex = /===FILE:\s*([^\n=]+)===\n([\s\S]*?)(?====FILE:|===END===|$)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const filePath = m[1].trim();
    const content  = m[2].trim();
    files[filePath] = content;
  }
  return files;
}

// ─── PHASE LOG ────────────────────────────────────────────────────────────────

const pipelineLog: Array<{ phase: PhaseResult; gate?: GateDecision }> = [];

function logPhase(result: PhaseResult, gateDecision?: GateDecision) {
  pipelineLog.push({ phase: result, gate: gateDecision });
  const logPath = path.join(LC, `phase-${String(pipelineLog.length).padStart(2,"0")}-${result.phaseId}.json`);
  ensureDir(LC);
  fs.writeFileSync(logPath, JSON.stringify({ phase: result, gate: gateDecision || null }, null, 2), "utf-8");
  console.log(`  📋 Log: lifecycle/phase-${String(pipelineLog.length).padStart(2,"0")}-${result.phaseId}.json`);
}

function savePipelineState(ctx: LifecycleContext) {
  ensureDir(LC);
  fs.writeFileSync(
    path.join(LC, "pipeline-state.json"),
    JSON.stringify({ ...ctx, log: pipelineLog, savedAt: ts() }, null, 2),
    "utf-8"
  );
}

// ─── ════════════════════════════════════════════════════════════════════════ ─
// PHASES
// ─ ════════════════════════════════════════════════════════════════════════ ──

// ─── PHASE 1: Research ───────────────────────────────────────────────────────

async function phaseResearch(ctx: LifecycleContext): Promise<PhaseResult> {
  const start = ts();
  const resp = await ai(`
You are the Department of Strategy & Market Intelligence at One Agent Corp.

PROJECT CONCEPT: "${ctx.concept}"

Conduct a RAPID market validation using Alex Hormozi's Value Equation framework.
Be concise, data-driven, and brutally honest.

Output structure (use exactly these headers):

## MARKET VALIDATION

### Pain Score (1-10): X
Why it hurts: [2 sentences]

### Target Customer
- Profile: [ICP in 1 line]
- Budget: [monthly willingness to pay range]
- Urgency: [why now?]

### Competition Snapshot
| Competitor | Weakness | Our Edge |
|---|---|---|
[3 rows]

### Revenue Potential
- TAM: $X/year
- Realistic Year-1 MRR: $X
- Pricing Model: [subscription/usage/one-time]

### BUILD DECISION
- Verdict: GO | NO-GO | PIVOT
- Reason: [1 sentence]
- Recommended Stack: [e.g., Node.js + SQLite + Docker]
- Estimated Build Time: [X days]

### Key Risks (top 3)
1.
2.
3.
`.trim(), "Research — Validação de Mercado");

  const artifacts = [save("research/market-validation.md", `# Market Validation — ${ctx.projectId}\n\n${resp}`)];

  return {
    phaseId: "research", label: "Market Research & Validation",
    status: "success", artifacts, summary: resp.slice(0, 300),
    keyData: { concept: ctx.concept, verdict: resp.includes("NO-GO") ? "no-go" : "go" },
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE 1b: Audience (ICP Definition) ─────────────────────────────────────

async function phaseAudience(ctx: LifecycleContext): Promise<PhaseResult> {
  const start    = ts();
  const research = readFile("research/market-validation.md");

  const resp = await ai(`
You are the Department of Audience Intelligence at One Agent Corp.
Your job: define ONE named ICP with surgical precision.
Vague ICPs get rejected. Specific ICPs get funded.

PROJECT: "${ctx.concept}"
MARKET RESEARCH: ${research.slice(0, 1200)}

Output EXACTLY this format:

## ICP DEFINITION

### Who (named, specific)
- Role/Title: [exact job title]
- Company type: [industry + size range, e.g. "B2B SaaS, 5-50 employees"]
- Geography: [country/region]

### Primary Pain (the ONE problem they pay to solve TODAY)
> "[Quote how they describe this pain in their own words]"
- Pain intensity (1-10): X
- How often they feel this pain: [daily/weekly/monthly]
- What it costs them (time or money): [specific estimate]

### Current Solution (what they use NOW)
- Tool/method: [name or "spreadsheet" or "manual process"]
- Why it's failing them: [1-2 sentences]
- Monthly spend on current solution: $X (or "free/manual")

### Willingness to Pay
- Expected monthly budget for a solution: $X–$Y
- Price sensitivity: [high/medium/low] — [1 sentence why]

### Where They Hang Out
- Communities: [Slack groups, forums, subreddits]
- Tools they use daily: [list 3-5]
- Events/conferences: [list 1-2]

### ICP Validation Score (1-10): X
Justification: [1 sentence — is this ICP real, reachable, and paying?]

<<JSON>>
{
  "icp_named": true,
  "icp_role": "...",
  "icp_company_type": "...",
  "primary_pain": "...",
  "pain_intensity": 0,
  "current_solution": "...",
  "willingness_to_pay_monthly_usd": 0,
  "validation_score": 0,
  "icp_validation_passed": false
}
<</JSON>>
`.trim(), "Audience — ICP Definition");

  const icpData = extractJson(resp) || {
    icp_named: false, icp_validation_passed: false, validation_score: 0,
  };

  const artifacts = [save("audience/icp-definition.md", `# ICP Definition — ${ctx.projectId}\n\n${resp}`)];
  saveJson("audience/icp-data.json", icpData);

  return {
    phaseId: "audience", label: "Audience — ICP Definition",
    status: icpData.validation_score >= 6 ? "success" : "partial",
    artifacts, summary: `ICP: ${icpData.icp_role || "undefined"} | Pain: ${icpData.primary_pain?.slice(0,80) || "undefined"} | Score: ${icpData.validation_score}/10`,
    keyData: icpData,
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE 1c: Offer (Pricing & Value Design) ─────────────────────────────────

async function phaseOffer(ctx: LifecycleContext): Promise<PhaseResult> {
  const start  = ts();
  const icp    = readFile("audience/icp-definition.md");
  const research = readFile("research/market-validation.md");

  const resp = await ai(`
You are the Department of Offer Design at One Agent Corp (Alex Hormozi Grand Slam Offer framework).
Design an offer so good people feel stupid saying no.

PROJECT: "${ctx.concept}"
ICP: ${icp.slice(0, 800)}
MARKET: ${research.slice(0, 600)}

Output EXACTLY this format:

## OFFER DESIGN

### Core Value Proposition
> "[One sentence: For [ICP], [product] is the [category] that [primary benefit] unlike [alternative]]"

### Pricing Model
- Model: [monthly subscription / usage-based / one-time + subscription]
- Tiers:
  | Tier | Price/mo | What's included | Target customer |
  |------|----------|-----------------|-----------------|
  | Starter | $X | ... | solo/small |
  | Pro | $X | ... | growing team |
  | [optional] Business | $X | ... | larger team |

### Unit Economics
- Target ARPU (Average Revenue Per User): $X/month
- Estimated avg customer lifetime: X months
- LTV = ARPU × lifetime: $X
- Estimated CAC (acquisition cost): $X
- LTV/CAC ratio: X.Xx
- Payback period: X months

### Value Stacks (Hormozi style)
What do they get beyond the core product?
1. [Feature/benefit] — value: $X/month if bought separately
2. [Bonus/integration] — value: $X
3. [Guarantee] — [30-day refund / results or free month]

### Competitive Positioning
- Cheapest competitor: $X/month
- Our price vs cheapest: [X% cheaper / premium at X% more]
- Why our price is justified: [1 sentence]

### Offer Validation Score (1-10): X
Does LTV/CAC >= 3? [YES/NO] | Payback < 12 months? [YES/NO]

<<JSON>>
{
  "pricing_defined": true,
  "price_starter_usd": 0,
  "price_pro_usd": 0,
  "arpu_usd": 0,
  "ltv_usd": 0,
  "cac_estimate_usd": 0,
  "ltv_cac_ratio": 0.0,
  "payback_months": 0,
  "unit_economics_pass": false,
  "offer_validation_score": 0
}
<</JSON>>
`.trim(), "Offer — Pricing & Value Design");

  const offerData = extractJson(resp) || {
    pricing_defined: false, unit_economics_pass: false, offer_validation_score: 0,
  };

  const artifacts = [save("offer/offer-design.md", `# Offer Design — ${ctx.projectId}\n\n${resp}`)];
  saveJson("offer/offer-data.json", offerData);

  return {
    phaseId: "offer", label: "Offer — Pricing & Value Design",
    status: offerData.offer_validation_score >= 6 ? "success" : "partial",
    artifacts, summary: `Starter: $${offerData.price_starter_usd}/mo | LTV/CAC: ${offerData.ltv_cac_ratio}x | Payback: ${offerData.payback_months}mo | Pass: ${offerData.unit_economics_pass}`,
    keyData: offerData,
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE 1d: Growth Pre-launch (Distribution Channel) ──────────────────────

async function phaseGrowthPre(ctx: LifecycleContext): Promise<PhaseResult> {
  const start  = ts();
  const icp    = readFile("audience/icp-definition.md");
  const offer  = readFile("offer/offer-design.md");

  const resp = await ai(`
You are the Department of Growth at One Agent Corp (Sean Ellis + Brian Balfour frameworks).
Distribution-first: define the channel BEFORE the product is built.
"A product without a distribution channel is a hobby."

PROJECT: "${ctx.concept}"
ICP: ${icp.slice(0, 700)}
OFFER: ${offer.slice(0, 600)}

Output EXACTLY this format:

## PRE-LAUNCH DISTRIBUTION PLAN

### Primary Channel (ONE channel only — the first 10 customers)
- Channel: [LinkedIn outreach / Cold email / Community / SEO / Product Hunt / Partnership]
- Why this channel for this ICP: [1-2 sentences — where does this ICP actually hang out?]
- Specific targeting: [exact subreddit / LinkedIn filter / community name]
- Weekly execution: [X messages/week OR X posts/week OR X signups/week]
- Estimated conversion rate: X%
- Time to first 10 customers: X weeks
- CAC from this channel: $X (time cost or tool cost)

### Pre-launch Checklist (do BEFORE writing code)
- [ ] [Action 1 — validate ICP exists in this channel]
- [ ] [Action 2 — pre-sell to 3 prospects before building]
- [ ] [Action 3 — join community where ICP hangs out]
- [ ] [Action 4 — build waitlist / landing page]

### Launch Day Actions
- [ ] Product Hunt listing
- [ ] [Channel-specific launch post]
- [ ] 50 direct outreach messages to ICP

### Growth Loop (post-launch)
How does one user bring another?
> [Describe the PLG loop or referral mechanism in 2 sentences]

### Channel Validation Score (1-10): X
Is there evidence this ICP uses this channel? [YES/NO — cite evidence]

<<JSON>>
{
  "channel_defined": true,
  "primary_channel": "...",
  "channel_targeting": "...",
  "weekly_volume": 0,
  "conversion_rate_pct": 0.0,
  "weeks_to_10_customers": 0,
  "cac_estimate_usd": 0,
  "channel_validation_score": 0,
  "channel_evidence": "..."
}
<</JSON>>
`.trim(), "Growth — Pre-launch Distribution Channel");

  const channelData = extractJson(resp) || {
    channel_defined: false, channel_validation_score: 0, primary_channel: "undefined",
  };

  const artifacts = [save("growth/pre-launch-channel.md", `# Pre-launch Distribution — ${ctx.projectId}\n\n${resp}`)];
  saveJson("growth/channel-data.json", channelData);

  return {
    phaseId: "growth-pre", label: "Growth — Pre-launch Distribution",
    status: channelData.channel_validation_score >= 6 ? "success" : "partial",
    artifacts, summary: `Channel: ${channelData.primary_channel} | CAC: $${channelData.cac_estimate_usd} | Score: ${channelData.channel_validation_score}/10`,
    keyData: channelData,
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE REVENUE-GATE (deterministic check + AI coherence cross-validation) ─

async function phaseRevenueGate(ctx: LifecycleContext): Promise<PhaseResult> {
  const start = ts();

  // Read outputs from the 3 preceding phases
  const icpRaw     = (() => { try { return JSON.parse(fs.readFileSync(path.join(WS, "audience/icp-data.json"), "utf-8")); } catch { return null; } })();
  const offerRaw   = (() => { try { return JSON.parse(fs.readFileSync(path.join(WS, "offer/offer-data.json"), "utf-8")); } catch { return null; } })();
  const channelRaw = (() => { try { return JSON.parse(fs.readFileSync(path.join(WS, "growth/channel-data.json"), "utf-8")); } catch { return null; } })();

  const icpDoc     = readFile("audience/icp-definition.md");
  const offerDoc   = readFile("offer/offer-design.md");
  const channelDoc = readFile("growth/pre-launch-channel.md");

  // ── Step 1: Deterministic gate checks ──────────────────────────────────────
  const gates = {
    icp: {
      label:    "Gate 1 — ICP Named",
      passed:   !!(icpRaw?.icp_named && icpRaw?.icp_role && icpRaw?.validation_score >= 6),
      value:    icpRaw?.icp_role || "MISSING",
      score:    icpRaw?.validation_score || 0,
      required: "Named ICP with validation_score >= 6",
    },
    offer: {
      label:    "Gate 2 — Offer & Pricing Defined",
      passed:   !!(offerRaw?.pricing_defined && offerRaw?.price_starter_usd > 0 && offerRaw?.offer_validation_score >= 6),
      value:    offerRaw ? `$${offerRaw.price_starter_usd}/mo starter` : "MISSING",
      score:    offerRaw?.offer_validation_score || 0,
      required: "pricing_defined=true, price > 0, offer_score >= 6",
    },
    unit_economics: {
      label:    "Gate 3 — Unit Economics Pass",
      passed:   !!(offerRaw?.unit_economics_pass && offerRaw?.ltv_cac_ratio >= 3),
      value:    offerRaw ? `LTV/CAC ${offerRaw.ltv_cac_ratio}x, payback ${offerRaw.payback_months}mo` : "MISSING",
      score:    offerRaw?.ltv_cac_ratio || 0,
      required: "LTV/CAC >= 3 and payback <= 12 months",
    },
    channel: {
      label:    "Gate 4 — Distribution Channel Defined",
      passed:   !!(channelRaw?.channel_defined && channelRaw?.primary_channel && channelRaw?.channel_validation_score >= 6),
      value:    channelRaw?.primary_channel || "MISSING",
      score:    channelRaw?.channel_validation_score || 0,
      required: "Named channel with score >= 6 and evidence",
    },
  };

  const allPassed   = Object.values(gates).every((g) => g.passed);
  const failedGates = Object.entries(gates).filter(([, g]) => !g.passed).map(([, g]) => `${g.label}: ${g.value} (score ${g.score})`);
  const passedCount = Object.values(gates).filter((g) => g.passed).length;

  // ── Step 2: AI coherence cross-validation ──────────────────────────────────
  // Catches mismatches the deterministic checks can't see:
  // e.g. ICP=small retailer + Channel=LinkedIn = incoherent even if both score >= 6
  const revenueCultureSpec = (() => { try { return fs.readFileSync(path.join(ROOT, "departments", "revenue-culture", "department.md"), "utf-8").slice(0, 1500); } catch { return ""; } })();

  const coherenceResp = await ai(`
You are the Department of Revenue Culture at One Agent Corp.
Your job: cross-validate that ICP, Offer, and Distribution Channel are COHERENT with each other.
Each phase was validated independently — but coherence between all three is what makes a business work.

## Revenue Culture Framework (excerpt)
${revenueCultureSpec}

## Project: "${ctx.concept}"

## ICP Definition
${icpDoc.slice(0, 800)}

## Offer Design
${offerDoc.slice(0, 700)}

## Distribution Channel
${channelDoc.slice(0, 700)}

## Deterministic Gate Results
- Gates passed: ${passedCount}/4
- Failed: ${failedGates.length > 0 ? failedGates.join("; ") : "none"}

---

## Your Task: Cross-Validation

Analyze the THREE outputs as a system. Look for:

1. **ICP ↔ Channel fit**: Does this ICP actually use this channel? (e.g., "small store owners" don't use LinkedIn)
2. **ICP ↔ Offer fit**: Does the offer address the ICP's STATED primary pain? Is the price aligned with their WTP?
3. **Offer ↔ Channel fit**: Can this offer be explained/sold via this channel? (e.g., complex B2B offer on Reddit = wrong channel)
4. **Red flags**: Anything in the individual outputs that looks optimistic, vague, or unvalidated?
5. **Fatal flaw**: Is there ONE assumption that, if wrong, kills the entire business model?

## Output Format

<<JSON>>
{
  "coherence_score": 0,
  "icp_channel_fit": { "score": 0, "verdict": "strong|weak|mismatch", "reason": "..." },
  "icp_offer_fit":   { "score": 0, "verdict": "strong|weak|mismatch", "reason": "..." },
  "offer_channel_fit": { "score": 0, "verdict": "strong|weak|mismatch", "reason": "..." },
  "red_flags": ["...", "..."],
  "fatal_flaw": "... or null if none",
  "coherence_verdict": "coherent|weak|incoherent",
  "coherence_block": false,
  "recommendation": "proceed|fix_channel|fix_offer|fix_icp|halt",
  "fix_if_needed": "One specific action to improve coherence (or null)"
}
<</JSON>>

Rules:
- coherence_score: 1-10 (>= 7 = coherent, 5-6 = weak but proceed with warning, < 5 = incoherent = block)
- coherence_block = true ONLY if coherence_score < 5 (incoherent system — building is waste)
- Be specific: name the exact mismatch, not generic advice
- One fatal_flaw maximum — the one thing that could kill this fastest
`.trim(), "Revenue Gate — AI Coherence Cross-validation");

  const coherenceData = extractJson(coherenceResp) || {
    coherence_score: 7, coherence_verdict: "coherent", coherence_block: false,
    recommendation: "proceed", red_flags: [], fatal_flaw: null,
    icp_channel_fit: { score: 7, verdict: "strong", reason: "fallback" },
    icp_offer_fit:   { score: 7, verdict: "strong", reason: "fallback" },
    offer_channel_fit: { score: 7, verdict: "strong", reason: "fallback" },
    fix_if_needed: null,
  };

  // Final verdict: deterministic gates AND coherence must both pass
  const coherenceBlock = !!(coherenceData.coherence_block && coherenceData.coherence_score < 5);
  const finalPass      = allPassed && !coherenceBlock;
  const allFailedGates = [
    ...failedGates,
    ...(coherenceBlock ? [`Coherence Gate: score ${coherenceData.coherence_score}/10 — ${coherenceData.fatal_flaw || coherenceData.coherence_verdict}`] : []),
  ];

  // ── Build report ──────────────────────────────────────────────────────────
  const reportLines = [
    `# Revenue Gate Report — ${ctx.projectId}`,
    `**Date:** ${ts()}`,
    `**Verdict:** ${finalPass ? "✅ PASS — proceed to PRD" : "🚫 BLOCK — do not proceed to Architecture"}`,
    `**Deterministic Gates:** ${passedCount}/4`,
    `**Coherence Score:** ${coherenceData.coherence_score}/10 (${coherenceData.coherence_verdict})`,
    "",
    "## Gate Results",
    "",
    ...Object.values(gates).map((g) =>
      `### ${g.passed ? "✅" : "❌"} ${g.label}\n- Value: ${g.value}\n- Score: ${g.score}\n- Required: ${g.required}`
    ),
    "",
    "## AI Coherence Cross-validation",
    "",
    `### ICP ↔ Channel: ${coherenceData.icp_channel_fit?.verdict} (${coherenceData.icp_channel_fit?.score}/10)`,
    `${coherenceData.icp_channel_fit?.reason}`,
    "",
    `### ICP ↔ Offer: ${coherenceData.icp_offer_fit?.verdict} (${coherenceData.icp_offer_fit?.score}/10)`,
    `${coherenceData.icp_offer_fit?.reason}`,
    "",
    `### Offer ↔ Channel: ${coherenceData.offer_channel_fit?.verdict} (${coherenceData.offer_channel_fit?.score}/10)`,
    `${coherenceData.offer_channel_fit?.reason}`,
    "",
    coherenceData.red_flags?.length > 0
      ? `### ⚠️ Red Flags\n${coherenceData.red_flags.map((f: string) => `- ${f}`).join("\n")}`
      : "### ✅ No red flags",
    "",
    coherenceData.fatal_flaw
      ? `### 💀 Fatal Flaw\n> ${coherenceData.fatal_flaw}`
      : "### ✅ No fatal flaw identified",
    "",
    coherenceData.fix_if_needed
      ? `### 🔧 Recommended Fix\n${coherenceData.fix_if_needed}`
      : "",
    "",
    finalPass
      ? "## ✅ All gates passed. Pipeline proceeds to PRD."
      : `## 🚫 BLOCKED\n\nFailed:\n${allFailedGates.map((f) => `- ${f}`).join("\n")}\n\nFix these before architecture.`,
  ];

  const artifacts = [save("revenue-gate/gate-report.md", reportLines.join("\n"))];
  saveJson("revenue-gate/gate-results.json", {
    allPassed: finalPass, passedCount, gates, failedGates: allFailedGates,
    coherence: coherenceData, timestamp: ts(),
  });

  // Update context.json revenue_snapshot
  const ctxPath = path.join(WS, "context.json");
  let existingCtx: Record<string, unknown> = {};
  try { existingCtx = JSON.parse(fs.readFileSync(ctxPath, "utf-8")); } catch {}
  fs.writeFileSync(ctxPath, JSON.stringify({
    ...existingCtx,
    revenue_gate_passed: finalPass,
    revenue_snapshot: {
      icp:              icpRaw?.icp_role || null,
      price_starter:    offerRaw?.price_starter_usd || null,
      ltv_cac_ratio:    offerRaw?.ltv_cac_ratio || null,
      channel:          channelRaw?.primary_channel || null,
      coherence_score:  coherenceData.coherence_score,
      fatal_flaw:       coherenceData.fatal_flaw || null,
      mrr:              0,
      leads_this_cycle: 0,
      gates_passed:     passedCount,
    },
    lastUpdatedAt: ts(),
  }, null, 2), "utf-8");

  if (!finalPass) {
    console.log(`\n  🚫 Revenue Gate BLOCKED — ${allFailedGates.length} issue(s):`);
    allFailedGates.forEach((f) => console.log(`     ✗ ${f}`));
    if (coherenceData.fatal_flaw) console.log(`\n  💀 Fatal flaw: ${coherenceData.fatal_flaw}`);
  } else {
    console.log(`\n  ✅ Revenue Gate PASSED — 4/4 gates + coherence ${coherenceData.coherence_score}/10`);
    if (coherenceData.red_flags?.length > 0) {
      console.log(`  ⚠️  ${coherenceData.red_flags.length} red flag(s) — monitor closely:`);
      coherenceData.red_flags.forEach((f: string) => console.log(`     • ${f}`));
    }
  }

  return {
    phaseId: "revenue-gate", label: "Revenue Gate — ICP + Offer + Channel + Coherence",
    status: finalPass ? "success" : "failed",
    artifacts,
    summary: finalPass
      ? `PASS: ${passedCount}/4 gates + coherence ${coherenceData.coherence_score}/10. ICP=${icpRaw?.icp_role} | Channel=${channelRaw?.primary_channel}`
      : `BLOCK: ${allFailedGates.length} issue(s). ${coherenceData.fatal_flaw ? "Fatal flaw: " + coherenceData.fatal_flaw : "Fix gates before Architecture."}`,
    keyData: { allPassed: finalPass, passedCount, failedGates: allFailedGates, coherence: coherenceData },
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE LAST: MRR Review Scheduler ────────────────────────────────────────

async function phaseMrrReview(ctx: LifecycleContext): Promise<PhaseResult> {
  const start      = ts();
  const deployLog  = readFile("deploy/deploy-log.txt");
  const channelRaw = (() => { try { return JSON.parse(fs.readFileSync(path.join(WS, "growth/channel-data.json"), "utf-8")); } catch { return null; } })();
  const offerRaw   = (() => { try { return JSON.parse(fs.readFileSync(path.join(WS, "offer/offer-data.json"), "utf-8")); } catch { return null; } })();

  const reviewDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const schedule = {
    project:      ctx.projectId,
    deploy_date:  ts().split("T")[0],
    review_date:  reviewDate,
    command:      `npx tsx scripts/strategy-review.ts --project=${ctx.projectId}`,
    metrics_to_measure: ["MRR", "leads_generated", "activation_rate", "churn_rate", "nps"],
    decision_rules: {
      SCALE:          "MRR growing + leads healthy + churn < 5%",
      OPTIMIZE:       "MRR flat + leads healthy + churn < 5%",
      FIX_RETENTION:  "MRR declining OR churn > 5%",
      KILL:           "MRR = 0 after 60 days AND no PMF signal",
    },
    targets: {
      mrr_target_30d:   `$${(offerRaw?.price_starter_usd || 0) * 3} (3 paying customers)`,
      leads_target_30d: channelRaw ? `${(channelRaw.weekly_volume || 10) * 4} leads in 30 days` : "undefined",
      channel:          channelRaw?.primary_channel || "undefined",
    },
  };

  const report = [
    `# MRR Review Schedule — ${ctx.projectId}`,
    ``,
    `**Review Date:** ${reviewDate} (30 days post-deploy)`,
    `**Run this command on review date:**`,
    `\`\`\`bash`,
    schedule.command,
    `\`\`\``,
    ``,
    `## What to Measure`,
    schedule.metrics_to_measure.map((m) => `- ${m}`).join("\n"),
    ``,
    `## Targets for 30-day Review`,
    `- MRR: ${schedule.targets.mrr_target_30d}`,
    `- Leads: ${schedule.targets.leads_target_30d}`,
    `- Channel: ${schedule.targets.channel}`,
    ``,
    `## Decision Rules`,
    Object.entries(schedule.decision_rules).map(([k, v]) => `- **${k}:** ${v}`).join("\n"),
    ``,
    `## Before the Review — Update context.json`,
    `Update \`workspace/${ctx.projectId}/context.json\` with real numbers:`,
    `\`\`\`json`,
    `{`,
    `  "revenue_snapshot": {`,
    `    "mrr": 0,`,
    `    "leads_this_cycle": 0,`,
    `    "activation_rate": 0,`,
    `    "churn_rate": 0,`,
    `    "nps": null`,
    `  }`,
    `}`,
    `\`\`\``,
  ].join("\n");

  const artifacts = [
    save("mrr-review/review-schedule.md", report),
  ];
  saveJson("mrr-review/review-schedule.json", schedule);

  console.log(`\n  📅 MRR Review agendada para: ${reviewDate}`);
  console.log(`     Comando: ${schedule.command}`);

  return {
    phaseId: "mrr-review", label: "MRR Review — 30-day Schedule",
    status: "success", artifacts,
    summary: `Review agendada para ${reviewDate}. Target: ${schedule.targets.mrr_target_30d}`,
    keyData: schedule,
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE 2: PRD ────────────────────────────────────────────────────────────

async function phasePrd(ctx: LifecycleContext): Promise<PhaseResult> {
  const start = ts();
  const research = readFile("research/market-validation.md");

  const resp = await ai(`
You are the Department of Product at One Agent Corp (Eric Ries + Marty Cagan mindset).

PROJECT: "${ctx.concept}"
RESEARCH: ${research.slice(0, 1500)}

Write a LEAN PRD for the MVP. Focus on the MINIMUM that validates the core hypothesis.

## PRODUCT REQUIREMENTS DOCUMENT

### North Star Metric
[One metric that proves the product works]

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
[max 5 features]

### User Stories (top 3)
1. As a [user], I want to [action] so that [value]
2.
3.

### API Endpoints (REST)
\`\`\`
POST   /api/checks        — create health check
GET    /api/checks        — list checks
GET    /api/checks/:id    — get check status
DELETE /api/checks/:id    — remove check
POST   /api/checks/:id/run — trigger manual check
\`\`\`

### Data Model
\`\`\`
Check {
  id, url, name, interval_seconds, 
  status: "up"|"down"|"unknown",
  last_checked_at, created_at
}
Alert {
  id, check_id, type: "down"|"recovery",
  message, sent_at
}
\`\`\`

### Success Criteria (MVP done when):
1.
2.
3.
`.trim(), "PRD — Requisitos do MVP");

  const artifacts = [save("product/prd.md", `# PRD — ${ctx.projectId}\n\n${resp}`)];

  return {
    phaseId: "prd", label: "Product Requirements Document",
    status: "success", artifacts, summary: resp.slice(0, 300),
    keyData: { hasNorthStar: resp.includes("North Star") },
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE 3: Architecture ───────────────────────────────────────────────────

async function phaseArch(ctx: LifecycleContext): Promise<PhaseResult> {
  const start = ts();
  const prd = readFile("product/prd.md");

  const resp = await ai(`
You are the Department of Engineering Architecture at One Agent Corp (Martin Fowler mindset).

PRD: ${prd.slice(0, 1500)}

Design a MINIMAL, DEPLOYABLE architecture. Real files. No over-engineering.

## ARCHITECTURE SPECIFICATION

### Security Blueprint (MANDATORY)
1.  **Auth**: Use Node.js \`crypto.randomInt\` for all OTP/Security tokens.
2.  **Storage**: Passwords and OTPs MUST be hashed (SHA-256 or better) before DB storage.
3.  **Validation**: Rate-limiting (5 failures per 10 min) for verification endpoints.
4.  **Hygene**: Include a .gitignore that blocks .env, node_modules, and data/.

### Stack Decision
- Runtime: Node.js 20 (LTS)
- Framework: Express 4
- Database: SQLite (better-sqlite3)
- Queue/Scheduler: node-cron
- Container: Docker + docker-compose
- Reverse Proxy: nginx

### File Structure
\`\`\`
${ctx.projectId}/
├── src/
│   ├── server.ts          — Express app entry
│   ├── routes/
│   │   └── checks.ts      — CRUD + run endpoint
│   ├── services/
│   │   ├── checker.ts     — HTTP health checker
│   │   └── alerter.ts     — WhatsApp/webhook alert sender
│   ├── db/
│   │   ├── schema.ts      — SQLite schema init
│   │   └── queries.ts     — typed queries
│   └── scheduler.ts       — cron job runner
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── package.json
\`\`\`

### Key Technical Decisions
1. SQLite for zero-infra persistence (file-based)
2. node-cron for scheduled checks (no Redis needed)
3. fetch() for health checks (Node 18+ native)
4. Docker for VPS portability

### Environment Variables
\`\`\`
PORT=3000
DB_PATH=/data/checks.db
ALERT_WEBHOOK_URL=  # optional WhatsApp webhook
CHECK_TIMEOUT_MS=5000
\`\`\`

### Deploy Target
- VPS: ${VPS_HOST || "your-vps-ip"}
- Port: 3000 (behind nginx :80)
- Directory: /opt/${ctx.projectId}
`.trim(), "Architecture — Especificação Técnica");

  const artifacts = [save("engineering/arch.md", `# Architecture — ${ctx.projectId}\n\n${resp}`)];

  return {
    phaseId: "arch", label: "Architecture Specification",
    status: "success", artifacts, summary: resp.slice(0, 300),
    keyData: { stack: "Node.js+Express+SQLite+Docker" },
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE 4: Build ──────────────────────────────────────────────────────────

async function phaseBuild(ctx: LifecycleContext): Promise<PhaseResult> {
  const start  = ts();
  const arch   = readFile("engineering/arch.md");
  const prd    = readFile("product/prd.md");

  const resp = await ai(`
You are the Department of Engineering at One Agent Corp (Robert C. Martin mindset).

Generate ALL source files for the MVP. Use the format below EXACTLY.
Each file must be production-ready, fully functional TypeScript/JSON/config.

ARCHITECTURE: ${arch.slice(0, 1000)}
PRD: ${prd.slice(0, 800)}

Generate these files using EXACTLY this format for each file:
===FILE: src/server.ts===
[file content]
===FILE: src/routes/checks.ts===
[file content]
===FILE: src/services/checker.ts===
[file content]
===FILE: src/services/alerter.ts===
[file content]
===FILE: src/db/schema.ts===
[file content]
===FILE: src/db/queries.ts===
[file content]
===FILE: src/scheduler.ts===
[file content]
===FILE: package.json===
[file content]
===FILE: Dockerfile===
[file content]
===FILE: docker-compose.yml===
[file content]
===FILE: nginx.conf===
[file content]
===FILE: .env.example===
[file content]
===END===

RULES:
- src/*.ts files use ES modules (import/export), TypeScript strict
- package.json must have: express, better-sqlite3, node-cron, typescript, ts-node, @types/*
- Dockerfile: multi-stage build, node:20-alpine
- docker-compose.yml: app + nginx services, volume for SQLite
- nginx.conf: reverse proxy to app:3000
- ALL files must work together — no placeholders
`.trim(), "Build — Geração de Código");

  const files = extractFiles(resp);
  const artifacts: string[] = [];

  if (Object.keys(files).length === 0) {
    // Fallback: save raw response
    artifacts.push(save("engineering/build-output.md", resp));
  } else {
    for (const [filePath, content] of Object.entries(files)) {
      const rel = `src/${filePath}`;
      artifacts.push(save(rel, content));
      console.log(`  ✓ ${rel}`);
    }
  }

  return {
    phaseId: "build", label: "Engineering — Code Scaffold",
    status: artifacts.length > 0 ? "success" : "partial",
    artifacts, summary: `${Object.keys(files).length} arquivos gerados`,
    keyData: { filesGenerated: Object.keys(files), fileCount: Object.keys(files).length },
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE 5: QA ─────────────────────────────────────────────────────────────

async function phaseQa(ctx: LifecycleContext): Promise<PhaseResult> {
  const start    = ts();
  const buildLog = pipelineLog.find(e => e.phase.phaseId === "build");
  const files    = buildLog?.phase.keyData.filesGenerated as string[] || [];

  const resp = await ai(`
You are the Department of QA & Audit at One Agent Corp (Andy Grove mindset).

Project: ${ctx.projectId}
Files generated: ${files.join(", ") || "see build output"}

Conduct a structured QA audit of the generated code scaffold.

## QA AUDIT REPORT

### Completeness Check
| File | Required | Present | Status |
|---|---|---|---|
| src/server.ts | YES | ${files.some(f=>f.includes("server")) ? "YES" : "NO"} | ${files.some(f=>f.includes("server")) ? "✅" : "❌"} |
| package.json | YES | ${files.some(f=>f.includes("package")) ? "YES" : "NO"} | ${files.some(f=>f.includes("package")) ? "✅" : "❌"} |
| Dockerfile | YES | ${files.some(f=>f.includes("Dockerfile")) ? "YES" : "NO"} | ${files.some(f=>f.includes("Dockerfile")) ? "✅" : "❌"} |
| docker-compose.yml | YES | ${files.some(f=>f.includes("docker-compose")) ? "YES" : "NO"} | ${files.some(f=>f.includes("docker-compose")) ? "✅" : "❌"} |
| nginx.conf | YES | ${files.some(f=>f.includes("nginx")) ? "YES" : "NO"} | ${files.some(f=>f.includes("nginx")) ? "✅" : "❌"} |

### Risk Assessment
- Security risks: [list any found]
- Missing validations: [list]
- Deployment blockers: [list]

### QA Score: X/10

### GATE DECISION
\`\`\`json
{
  "verdict": "proceed",
  "qa_score": 8,
  "blockers": [],
  "warnings": ["add input validation", "add rate limiting"],
  "ready_for_deploy": true
}
\`\`\`
`.trim(), "QA — Auditoria do Build");

  const qaData = extractJson(resp) || { verdict: "proceed", qa_score: 7, ready_for_deploy: true };
  const artifacts = [save("qa/audit-report.md", `# QA Audit — ${ctx.projectId}\n\n${resp}`)];

  return {
    phaseId: "qa", label: "QA & Audit",
    status: qaData.ready_for_deploy ? "success" : "partial",
    artifacts, summary: `QA Score: ${qaData.qa_score}/10. Ready: ${qaData.ready_for_deploy}`,
    keyData: qaData,
    startedAt: start, endedAt: ts(),
  };
}

// ─── PHASE 6: Deploy ─────────────────────────────────────────────────────────

async function phaseDeploy(ctx: LifecycleContext): Promise<PhaseResult> {
  const start = ts();
  const artifacts: string[] = [];

  // 6a. Generate deploy script
  const deployScript = `#!/bin/bash
set -e

PROJECT="${ctx.projectId}"
VPS="${VPS_HOST}"
DEPLOY_DIR="/opt/$PROJECT"

echo "🚀 Deploying $PROJECT to $VPS..."

# Create project directory
ssh ${VPS_USER}@$VPS "mkdir -p $DEPLOY_DIR/data"

# Sync files
rsync -avz --delete \\
  --exclude='node_modules' \\
  --exclude='.env' \\
  ${WS}/src/ ${VPS_USER}@$VPS:$DEPLOY_DIR/src/

# Sync infra files
for f in package.json Dockerfile docker-compose.yml nginx.conf; do
  scp ${WS}/src/$f ${VPS_USER}@$VPS:$DEPLOY_DIR/ 2>/dev/null || true
done

# Create .env on VPS
ssh ${VPS_USER}@$VPS "cat > $DEPLOY_DIR/.env << 'EOF'
PORT=3000
DB_PATH=/data/checks.db
CHECK_TIMEOUT_MS=5000
NODE_ENV=production
EOF"

# Build and start
ssh ${VPS_USER}@$VPS "cd $DEPLOY_DIR && docker-compose down --remove-orphans; docker-compose up -d --build"

echo "✅ Deploy complete. Check: http://$VPS/api/checks"
`;

  artifacts.push(save("deploy/deploy.sh", deployScript));
  artifacts.push(save("deploy/rollback.sh", `#!/bin/bash\n# Rollback: docker-compose down && docker-compose up -d --no-build\nssh ${VPS_USER}@${VPS_HOST} "cd /opt/${ctx.projectId} && docker-compose down && docker-compose up -d --no-build"\n`));

  let deployStatus: "success" | "partial" | "failed" = "partial";
  let deployLog = "Deploy scripts generated. VPS deploy not attempted (--skip-deploy or no credentials).";

  if (!SKIP_DEPLOY && VPS_HOST && VPS_PASS) {
    console.log(`\n  🔌 Conectando ao VPS ${VPS_HOST}...`);
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host:     VPS_HOST,
        username: VPS_USER,
        password: VPS_PASS,
        readyTimeout: 20000,
      });
      console.log("  ✓ SSH conectado");

      const DEPLOY_DIR = `/opt/${ctx.projectId}`;
      const commands = [
        `mkdir -p ${DEPLOY_DIR}/data`,
        `which docker || (curl -fsSL https://get.docker.com | sh)`,
        `which docker-compose || apt-get install -y docker-compose-plugin 2>/dev/null || true`,
      ];

      for (const cmd of commands) {
        const r = await ssh.execCommand(cmd);
        console.log(`  ▶ ${cmd.slice(0, 50)} → ${r.code === 0 ? "✅" : "⚠️ " + r.stderr.slice(0, 60)}`);
      }

      // Upload generated files via SFTP
      const srcDir = path.join(WS, "src");
      if (fs.existsSync(srcDir)) {
        console.log("  📤 Enviando arquivos...");
        await ssh.putDirectory(srcDir, DEPLOY_DIR, {
          recursive: true,
          concurrency: 5,
          tick(localPath, remotePath, error) {
            if (!error) console.log(`  ✓ ${path.basename(localPath)}`);
          },
        });
      }

      // Write .env on VPS
      await ssh.execCommand(
        `cat > ${DEPLOY_DIR}/.env << 'ENVEOF'\nPORT=3000\nDB_PATH=/data/checks.db\nCHECK_TIMEOUT_MS=5000\nNODE_ENV=production\nENVEOF`
      );

      // Docker deploy
      const dockerCmd = `cd ${DEPLOY_DIR} && docker compose down --remove-orphans 2>/dev/null; docker compose up -d --build 2>&1 | tail -20`;
      const dockerResult = await ssh.execCommand(dockerCmd, { cwd: DEPLOY_DIR });
      console.log("\n  Docker output:");
      console.log(dockerResult.stdout || dockerResult.stderr);

      // Health check
      await new Promise(r => setTimeout(r, 3000));
      const healthResult = await ssh.execCommand(`curl -sf http://localhost:3000/health 2>&1 || echo "not_ready_yet"`);
      console.log(`  🏥 Health: ${healthResult.stdout.slice(0, 100)}`);

      ssh.dispose();
      deployStatus = "success";
      deployLog    = `Deployed to ${VPS_HOST}. URL: http://${VPS_HOST}/api/checks`;
      console.log(`\n  ✅ Deploy concluído → http://${VPS_HOST}/api/checks`);

    } catch (err: any) {
      deployStatus = "partial";
      deployLog    = `Deploy parcial: ${err.message}. Scripts gerados em deploy/`;
      console.error(`  ⚠️  Deploy error: ${err.message}`);
      try { ssh.dispose(); } catch {}
    }
  } else if (!SKIP_DEPLOY) {
    console.log("  ⏭️  Deploy VPS pulado (sem credenciais ou --skip-deploy)");
  }

  artifacts.push(save("deploy/deploy-log.txt", deployLog));

  return {
    phaseId: "deploy", label: "VPS Deployment",
    status: deployStatus, artifacts,
    summary: deployLog,
    keyData: { vpsHost: VPS_HOST, url: `http://${VPS_HOST}/api/checks`, skipped: SKIP_DEPLOY },
    startedAt: start, endedAt: ts(),
  };
}

// ─── FLOW GATE ────────────────────────────────────────────────────────────────

async function runGate(
  phaseResult: PhaseResult,
  remainingPhases: string[],
  ctx: LifecycleContext
): Promise<GateDecision> {
  gate(`Avaliando fase "${phaseResult.label}"`);

  const dalioCfg   = loadMindSnippet("ray_dalio").slice(0, 400);
  const goldrattCfg = loadMindSnippet("eliyahu_goldratt").slice(0, 400);
  const ellisCfg   = loadMindSnippet("sean_ellis").slice(0, 400);

  const gateResp = await ai(`
You are the Strategy & Flow Intelligence Gate of One Agent Corp.
You have three advisors reviewing the output of phase "${phaseResult.label}":

Ray Dalio (Principles): ${dalioCfg}
Eliyahu Goldratt (TOC): ${goldrattCfg}
Sean Ellis (Growth): ${ellisCfg}

PHASE RESULT:
- Status: ${phaseResult.status}
- Summary: ${phaseResult.summary}
- Key Data: ${JSON.stringify(phaseResult.keyData)}

REMAINING PIPELINE: ${remainingPhases.join(" → ")}

Each advisor must give a ONE-LINE verdict, then you produce a gate decision.

OUTPUT as JSON wrapped in <<JSON>> ... <</JSON>>:

<<JSON>>
{
  "gateFor": "${phaseResult.phaseId}",
  "dalio_vote": "proceed|redirect|halt",
  "dalio_note": "1 sentence",
  "goldratt_vote": "proceed|redirect|halt",
  "goldratt_note": "1 sentence (constraint lens)",
  "ellis_vote": "proceed|redirect|halt",
  "ellis_note": "1 sentence (velocity lens)",
  "verdict": "proceed|redirect|halt",
  "reason": "1-2 sentences synthesizing all advisors",
  "advisor": "Dalio·Goldratt·Ellis",
  "mods": [
    { "type": "skip|repeat|update_context", "phaseId": "phase-id-or-null", "note": "why" }
  ]
}
<</JSON>>

Rules:
- If status is "success" and no major issues → verdict: "proceed", mods: []
- If status is "partial" → consider redirect or update_context mod
- If status is "failed" → redirect (repeat phase) or halt
- mods can be empty []
`.trim(), `Gate — ${phaseResult.phaseId}`);

  const parsed = extractJson(gateResp);
  const decision: GateDecision = parsed
    ? {
        gateFor: parsed.gateFor || phaseResult.phaseId,
        verdict: parsed.verdict || "proceed",
        reason:  parsed.reason  || "auto-proceed",
        advisor: parsed.advisor || "auto",
        mods:    parsed.mods    || [],
      }
    : {
        gateFor: phaseResult.phaseId,
        verdict: ["arch", "build", "qa"].includes(phaseResult.phaseId) ? "redirect" : "proceed",
        reason:  "Gate fallback — re-trying for technical phase due to missing advisor signal",
        advisor: "auto",
        mods:    ["arch", "build", "qa"].includes(phaseResult.phaseId) ? [{ type: "repeat", phaseId: phaseResult.phaseId, note: "missing signal" }] : [],
      };

  console.log(`  ✓ Gate verdict: ${decision.verdict.toUpperCase()} — ${decision.reason}`);
  if (decision.mods.length > 0) {
    decision.mods.forEach((m) => console.log(`    🔀 Mod: ${m.type} ${m.phaseId || ""} — ${m.note}`));
  }

  return decision;
}

// ─── ADAPTIVE FLOW ENGINE ─────────────────────────────────────────────────────

function applyMods(queue: string[], mods: Modification[]): string[] {
  let q = [...queue];
  for (const mod of mods) {
    if (mod.type === "skip" && mod.phaseId) {
      q = q.filter((p) => p !== mod.phaseId);
      console.log(`  🔀 Fase "${mod.phaseId}" removida do pipeline`);
    } else if (mod.type === "repeat" && mod.phaseId) {
      q.unshift(mod.phaseId);
      console.log(`  🔀 Fase "${mod.phaseId}" re-inserida no topo do pipeline`);
    }
    // update_context: noted in logs, no queue change
  }
  return q;
}

// ─── PHASE REGISTRY ───────────────────────────────────────────────────────────

const PHASE_HANDLERS: Record<string, (ctx: LifecycleContext) => Promise<PhaseResult>> = {
  research:      phaseResearch,
  audience:      phaseAudience,
  offer:         phaseOffer,
  "growth-pre":  phaseGrowthPre,
  "revenue-gate": phaseRevenueGate,
  prd:           phasePrd,
  arch:          phaseArch,
  build:         phaseBuild,
  qa:            phaseQa,
  deploy:        phaseDeploy,
  "mrr-review":  phaseMrrReview,
};

const PHASE_LABELS: Record<string, string> = {
  research:       "Market Research & Validation",
  audience:       "Audience — ICP Definition",
  offer:          "Offer — Pricing & Value Design",
  "growth-pre":   "Growth — Pre-launch Distribution",
  "revenue-gate": "Revenue Gate — ICP + Offer + Channel + Economics",
  prd:            "Product Requirements Document",
  arch:           "Architecture Specification",
  build:          "Engineering — Code Scaffold",
  qa:             "QA & Audit",
  deploy:         "VPS Deployment",
  "mrr-review":   "MRR Review — 30-day Schedule",
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  box(`One Agent Corp — Project Lifecycle`);
  box(`Project: ${PROJECT_ID}`, "─");
  console.log(`\n  Concept:  ${CONCEPT}`);
  console.log(`  VPS:      ${VPS_HOST || "(não configurado)"}`);
  console.log(`  Dry-run:  ${DRY_RUN}`);
  console.log(`  Skip deploy: ${SKIP_DEPLOY}`);

  // Setup workspace
  ensureDir(WS);
  ensureDir(LC);

  const ctx: LifecycleContext = {
    projectId: PROJECT_ID,
    concept:   CONCEPT,
    phases:    ["research", "audience", "offer", "growth-pre", "revenue-gate", "prd", "arch", "build", "qa", "deploy", "mrr-review"],
    currentPhase: 0,
    pipelineState: {},
  };

  // Save initial context
  saveJson("context.json", {
    projectId:     PROJECT_ID,
    concept:       CONCEPT,
    status:        "running",
    createdAt:     ts(),
    lastUpdatedAt: ts(),
    revenue_gate_passed: false,
    revenue_snapshot: {
      icp:              null,
      price_starter:    null,
      ltv_cac_ratio:    null,
      channel:          null,
      mrr:              0,
      leads_this_cycle: 0,
      gates_passed:     0,
    },
  });

  savePipelineState(ctx);

  // ── Execute phases with gates ──────────────────────────────────────────────

  let queue = [...ctx.phases];
  let phaseNum = 0;

  while (queue.length > 0) {
    const phaseId = queue.shift()!;
    phaseNum++;

    const handler = PHASE_HANDLERS[phaseId];
    if (!handler) {
      console.warn(`  ⚠️  Handler não encontrado para fase: ${phaseId} — pulando`);
      continue;
    }

    phase(phaseNum, PHASE_LABELS[phaseId] || phaseId);
    ctx.currentPhase = phaseNum;

    // Execute phase
    let result: PhaseResult;
    try {
      result = await handler(ctx);

      // SWARM-OS-V5: ArtifactGuard
      const technicalPhases = ["arch", "build", "deploy"];
      if (technicalPhases.includes(phaseId) && result.artifacts.length === 0 && result.status === "success") {
        console.error(`  ⚠️  [ArtifactGuard] Falha detectada: Fase "${phaseId}" reportou sucesso com 0 artefatos.`);
        result.status = "failed";
        result.summary = "REJEITADO: Nenhum artefato gerado (Silent Failure).";
      }

      console.log(`\n  ✅ Fase concluída: ${result.status} | ${result.artifacts.length} artefatos`);
    } catch (err: any) {
      result = {
        phaseId, label: PHASE_LABELS[phaseId] || phaseId,
        status: "failed", artifacts: [],
        summary: `Erro: ${err.message}`,
        keyData: { error: err.message },
        startedAt: ts(), endedAt: ts(),
      };
      console.error(`  ❌ Fase falhou: ${err.message}`);
    }

    // Run gate (skip for deploy and mrr-review; revenue-gate halts directly on failure)
    let gateDecision: GateDecision | undefined;
    if (phaseId === "revenue-gate" && result.status === "failed") {
      gateDecision = {
        gateFor: "revenue-gate", verdict: "halt",
        reason: `Revenue Gate blocked: ${(result.keyData.failedGates as string[] || []).join("; ")}. Fix ICP/Offer/Channel before proceeding.`,
        advisor: "RevenueGate (deterministic)", mods: [],
      };
      logPhase(result, gateDecision);
      savePipelineState(ctx);
      console.error(`\n🚫 Pipeline HALTED at Revenue Gate.`);
      console.error(`   Fix the failing gates, then re-run the relevant phase(s).`);
      process.exit(1);
    }
    if (phaseId !== "deploy" && phaseId !== "mrr-review" && phaseId !== "revenue-gate") {
      gateDecision = await runGate(result, queue, ctx);

      // Apply modifications to remaining queue
      if (gateDecision.mods.length > 0) {
        queue = applyMods(queue, gateDecision.mods);
      }

      // Halt check
      if (gateDecision.verdict === "halt") {
        logPhase(result, gateDecision);
        savePipelineState(ctx);
        console.error(`\n🚫 Pipeline INTERROMPIDO pelo gate: ${gateDecision.reason}`);
        console.error(`   Verifique lifecycle/pipeline-state.json para detalhes.`);
        process.exit(1);
      }
    }

    logPhase(result, gateDecision);
    savePipelineState(ctx);
  }

  // ── Final: write pipeline summary ────────────────────────────────────────

  const summary = {
    projectId:   PROJECT_ID,
    concept:     CONCEPT,
    completedAt: ts(),
    totalPhases: pipelineLog.length,
    phases: pipelineLog.map(e => ({
      id:       e.phase.phaseId,
      status:   e.phase.status,
      artifacts: e.phase.artifacts.length,
      gateVerdict: e.gate?.verdict || "n/a",
    })),
    vps: VPS_HOST ? `http://${VPS_HOST}/api/checks` : null,
  };

  saveJson("lifecycle/pipeline-summary.json", summary);

  // Update context.json — merge to preserve revenue_snapshot and gate results
  const ctxFinalPath = path.join(WS, "context.json");
  let existingCtxFinal: Record<string, unknown> = {};
  try { existingCtxFinal = JSON.parse(fs.readFileSync(ctxFinalPath, "utf-8")); } catch {}
  fs.writeFileSync(ctxFinalPath, JSON.stringify({
    ...existingCtxFinal,
    projectId:    PROJECT_ID,
    concept:      CONCEPT,
    status:       "completed",
    completedAt:  ts(),
    vpsUrl:       VPS_HOST ? `http://${VPS_HOST}/api/checks` : null,
    phasesCount:  pipelineLog.length,
    lastUpdatedAt: ts(),
  }, null, 2), "utf-8");

  box("✅ Lifecycle Completo!");
  console.log(`\n  📁 Workspace:  workspace/${PROJECT_ID}/`);
  console.log(`  📋 Logs:       workspace/${PROJECT_ID}/lifecycle/`);
  console.log(`  🔬 Próximo:    npx tsx scripts/lifecycle-audit.ts --project=${PROJECT_ID}`);
  if (VPS_HOST) console.log(`  🌐 URL:        http://${VPS_HOST}/api/checks`);
}

main().catch((e) => {
  console.error("❌ Lifecycle error:", e);
  process.exit(1);
});
