---
name: oac-pipeline
description: "One Agent Corp — Execute pipeline stages, approve gates, and advance projects through the micro-SaaS factory pipeline. Use when user says 'execute stage', 'run ideation', 'advance pipeline', 'approve gate', 'next stage', 'pipeline status', or any variation of progressing a project through the One Agent Corp pipeline. Stages: ideation, validation, mvp, launch, growth, scale. Also triggers on '/oac-pipeline'."
---

# OAC Pipeline — One Agent Corp Pipeline Executor

> **Trigger:** `/oac-pipeline ACTION="execute|gate|status|advance" PROJECT="<id-or-name>"`

You are the **Pipeline Executor** for One Agent Corp. You execute pipeline stages, process gates, and advance projects.

## Actions

### 1. Execute Current Stage (`ACTION=execute`)

Runs the current stage of a project and shows results.

### 2. Gate Approval (`ACTION=gate`)

Requests and processes CEO gate approval to advance to next stage.

### 3. Full Advance (`ACTION=advance`)

Execute stage + auto-approve gate + transition to next stage. One-shot progression.

### 4. Status (`ACTION=status`)

Show current pipeline state for all projects or a specific one.

## Execution

Navigate to project root:
```
C:\Users\Administrador\OneDrive\Documentos\0 SPEEDGROW\one-agent\one-agent-corp
```

Build first:
```bash
npm run build
```

### Execute Stage Script Template

Create `scripts/pipeline-{action}-{project-slug}.ts`:

```typescript
import { getCEOAgent } from '../src/index.js';
import { getPipelineEngine } from '../src/pipeline/pipeline-engine.js';
import { getCycleEngine } from '../src/cycles/cycle-engine.js';

const ceo = getCEOAgent();
const pipeline = getPipelineEngine();

// For execute + gate + advance, you need to recreate the project state first.
// The pipeline engine is in-memory, so you must recreate the project:
const project = pipeline.createProject({
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  owner: 'ceo',
  budget: BUDGET,
  targetMrr: TARGET_MRR,
  tags: TAGS,
});
pipeline.startProject(project.id);
```

### Action: Execute Current Stage

```typescript
// Execute the current stage
const stageResult = await pipeline.executeCurrentStage(project.id);

console.log(`Stage: ${stageResult.stage}`);
console.log(`Status: ${stageResult.status}`);
console.log(`Summary: ${stageResult.summary}`);
console.log(`Next Stage Ready: ${stageResult.next_stage_ready}`);
console.log('\nDeliverables:');
stageResult.deliverables.forEach(d => {
  console.log(`  [${d.status}] ${d.name}: ${d.artifact ?? 'pending'}`);
});
console.log('\nMetrics:');
Object.entries(stageResult.metrics).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});
console.log('\nInsights:');
stageResult.insights?.forEach(i => console.log(`  - ${i}`));
if (stageResult.blockers.length > 0) {
  console.log('\nBLOCKERS:');
  stageResult.blockers.forEach(b => console.log(`  !! ${b}`));
}
```

### Action: Gate Approval

```typescript
// After executeCurrentStage, project is in 'awaiting-gate' status
// Request gate approval (sends message to CEO)
const gate = pipeline.requestGateApproval(project.id);
console.log(`Gate ID: ${gate.id}`);
console.log(`From: ${gate.fromStage} -> To: ${gate.toStage}`);
console.log(`Score: ${gate.score}`);
console.log(`Recommendation: ${gate.recommendation}`);
```

### Action: Full Advance (execute + auto-approve)

```typescript
// Execute stage
const stageResult = await pipeline.executeCurrentStage(project.id);
console.log(`Stage ${stageResult.stage}: ${stageResult.status}`);

// Auto-approve gate if stage succeeded
if (stageResult.next_stage_ready) {
  const advanced = pipeline.applyGateDecision(project.id, 'approve', {
    reason: `Stage ${stageResult.stage} completed successfully. Metrics: ${JSON.stringify(stageResult.metrics)}`,
  });
  console.log(`Advanced to: ${advanced.currentStage} (${advanced.status})`);
} else {
  console.log('Stage not ready for advancement. Blockers:');
  stageResult.blockers.forEach(b => console.log(`  - ${b}`));
}
```

### Action: Status

```typescript
const allProjects = pipeline.getAllProjects();
const stats = pipeline.getSummaryStats();
console.log(`Total Projects: ${stats.total}`);
console.log(`By Stage:`, JSON.stringify(stats.byStage));
console.log(`By Status:`, JSON.stringify(stats.byStatus));
console.log(`Total MRR: $${stats.totalMrr}`);
allProjects.forEach(p => {
  console.log(`\n${p.metadata.name} (${p.id})`);
  console.log(`  Stage: ${p.currentStage} | Status: ${p.status}`);
  console.log(`  MRR: $${p.currentMrr} / $${p.metadata.targetMrr}`);
});
```

Run with:
```bash
npx tsx scripts/pipeline-{action}-{project-slug}.ts
```

## Pipeline Stages Reference

```
ideation -> [GATE] -> validation -> [GATE] -> mvp -> [GATE] -> launch -> [GATE] -> growth -> [GATE] -> scale -> [DONE]
```

| Stage | Key Departments | Days | Key Deliverables |
|-------|----------------|------|-----------------|
| ideation | product, data | 7 | Idea brief, TAM/SAM/SOM, competitor matrix, problem statement |
| validation | product, growth, data | 14 | User interviews, survey results, landing page test, willingness-to-pay |
| mvp | engineering, product | 21 | Working MVP, CI/CD, core features, basic analytics |
| launch | engineering, growth, sales | 7 | Deploy, onboarding flow, first users, support system |
| growth | growth, sales, data | 30 | Acquisition channels, retention metrics, playbook execution |
| scale | operations, engineering, growth | 30 | Cost optimization, automation, profitability metrics |

## Gate Decisions

- **approve** — advance to next stage
- **reject** — pause project
- **request-changes** — rework current stage, then `pipeline.resubmitStage(projectId)`

## Save Report

After each stage execution, append to `reports/pipeline-{project-slug}.md`:

```markdown
## Stage: {stage_name} — {date}

**Status:** {success|blocked}
**Score:** {pass_score}/100
**Recommendation:** {approve|reject|request-changes}

### Deliverables
- [done] Deliverable 1: artifact
- [done] Deliverable 2: artifact

### Metrics
| Metric | Value |
|--------|-------|
| metric_1 | value |

### Insights
- insight 1
- insight 2

### Decision
{CEO decision and reason}

### Next Stage: {next_stage_name}
```

## Critical Rules

1. **Pipeline is in-memory** — project state must be recreated each session
2. Always `npm run build` before running scripts
3. Use `npx tsx` to execute TypeScript
4. Save stage results to `reports/` for persistence across sessions
5. After advancing, update the report with the gate decision
6. If stage has blockers, do NOT auto-approve — show blockers and ask CEO (user)
