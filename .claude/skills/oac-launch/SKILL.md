---
name: oac-launch
description: "One Agent Corp — Launch a new micro-SaaS project. Creates project via CEO agent, initializes pipeline, creates experimentation cycles with ICE scoring. Use when user says 'launch project', 'new micro-saas', 'create project', 'start new product', or any variation of starting a new product in One Agent Corp. Also triggers on '/oac-launch'."
---

# OAC Launch — One Agent Corp Project Launcher

> **Trigger:** `/oac-launch PROJECT="<name>" DESCRIPTION="<desc>"` or natural language like "launch a new project called X"

You are the **Project Launcher** for One Agent Corp. You execute the full launch sequence in one shot.

## Required Parameters

Collect these from the user (ask via AskUserQuestion if missing):

| Parameter | Description | Default |
|-----------|-------------|---------|
| `PROJECT` | Project name | *required* |
| `DESCRIPTION` | What the product does, who it's for | *required* |
| `BUDGET` | USD budget | 8000 |
| `TARGET_MRR` | Monthly recurring revenue target | 5000 |
| `TIMELINE` | Deadline | "8 weeks" |
| `DEPARTMENTS` | Involved departments | product, engineering, growth, sales, data |
| `RISK` | low / medium / high | low |
| `PRIORITY` | low / normal / high / critical | high |
| `CYCLES` | Number of initial experiment cycles to create | 3 |

## Execution Sequence

### Step 1: Build and run launch script

Navigate to the One Agent Corp project root:
```
C:\Users\Administrador\OneDrive\Documentos\0 SPEEDGROW\one-agent\one-agent-corp
```

Build the project:
```bash
npm run build
```

### Step 2: Create and execute the launch script

Create a TypeScript script at `scripts/launch-{project-slug}.ts` that does:

```typescript
import { getCEOAgent } from '../src/index.js';
import { getPipelineEngine } from '../src/pipeline/pipeline-engine.js';
import { getCycleEngine } from '../src/cycles/cycle-engine.js';

const ceo = getCEOAgent();

// 1. Launch project via CEO
const launchResult = ceo.execute({
  kind: 'launch-project',
  projectName: PROJECT,
  description: DESCRIPTION,
  budget: BUDGET,
  targetMrr: TARGET_MRR,
  timeline: TIMELINE,
  departments: DEPARTMENTS,
  strategicAlignment: '...', // infer from description
  riskLevel: RISK,
  priority: PRIORITY,
});

// 2. Create pipeline project
const pipeline = getPipelineEngine();
const pipelineProject = pipeline.createProject({
  name: PROJECT,
  description: DESCRIPTION,
  owner: 'ceo',
  budget: BUDGET,
  targetMrr: TARGET_MRR,
  tags: ['micro-saas', ...inferred_tags],
});
pipeline.startProject(pipelineProject.id);

// 3. Create experimentation cycles
// For each cycle, use `ice:` (NOT `iceScore:`)
const cycleEngine = getCycleEngine();
cycleEngine.createCycle({
  projectId: pipelineProject.id,
  hypothesis: '...',
  minimumTest: '...',
  targetMetric: '...',
  targetValue: ...,
  department: '...',
  estimatedDuration: '...',
  ice: { impact: N, confidence: N, ease: N }, // IMPORTANT: field is `ice`, not `iceScore`
});

// 4. CEO status check
ceo.execute({ kind: 'status', scope: 'all' });
```

Execute with:
```bash
npx tsx scripts/launch-{project-slug}.ts
```

### Step 3: Generate cycles intelligently

For each cycle, design experiments that follow the ACID protocol:
- **A**ction: specific thing to do
- **C**riterion: number, not opinion
- **I**nterval: deadline
- **D**ata: metric to measure

Prioritize by ICE score. Include at least:
1. One **quick win** (ease >= 9, duration <= 3d) — e.g., CTA test, copy change
2. One **core validation** (impact >= 8) — e.g., landing page + pre-signups
3. One **demand signal** (confidence test) — e.g., warm outreach, interviews

### Step 4: Save launch report

Save a summary to `reports/launch-{project-slug}-{date}.md` with:
- Project ID, Pipeline ID
- Budget, Target MRR, Timeline
- Departments involved
- Cycles created (sorted by ICE)
- ABZ Planning (Plan A, Plan B, Plan Z)
- Next steps with owners and deadlines

### Step 5: Output summary to user

Print a concise table with all IDs, cycle ICE scores, and immediate next actions.

## Critical Rules

1. **Field name is `ice`, NOT `iceScore`** in CycleEngine.createCycle()
2. Always `npm run build` before executing scripts
3. Use `npx tsx` to run TypeScript scripts directly
4. Always include ABZ Planning in the report
5. Cycles must have measurable targetMetric and targetValue
6. Generate project-specific cycles, not generic ones
