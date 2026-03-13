// One Agent Corp — Knowledge Base Engine
// Self-improvement engine: saves outputs, evaluates quality, and refines prompts

import { promises as fs } from 'fs';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { ClaudeExecutor } from '../executor/claude-executor.js';
import type {
  KnowledgeBaseEntry,
  EvaluationResult,
  KnowledgeBaseStats,
  PromptVersion,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '..');
const EVALUATION_MODEL = 'claude-sonnet-4-5';

function _kbDir(dept: string): string {
  return path.join(SRC_DIR, 'departments', dept, 'knowledge-base');
}

function _goodDir(dept: string): string {
  return path.join(_kbDir(dept), 'good-outputs');
}

function _badDir(dept: string): string {
  return path.join(_kbDir(dept), 'bad-outputs');
}

function _promptVersionsDir(dept: string, promptName: string): string {
  return path.join(SRC_DIR, 'departments', dept, 'prompts', 'prompt-versions', promptName);
}

function _hashOutput(output: string): string {
  return createHash('sha256').update(output).digest('hex').slice(0, 16);
}

/** Parse JSON safely; return null on failure */
function _tryParseJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export class KnowledgeBaseEngine {
  private readonly executor: ClaudeExecutor;

  constructor() {
    this.executor = new ClaudeExecutor();
  }

  /**
   * Saves an output to the knowledge base.
   * Evaluates the output using a rubric derived from the department name,
   * then stores it in good-outputs/ (score >= 6) or bad-outputs/ (score < 6).
   */
  async saveOutput(
    dept: string,
    output: string,
    promptVersion: string
  ): Promise<KnowledgeBaseEntry> {
    const rubricPath = path.join(_kbDir(dept), 'rubric.md');

    let evaluation: EvaluationResult;
    try {
      evaluation = await this.evaluate(dept, output, rubricPath);
    } catch {
      // If evaluation fails (e.g., rubric not found), default to neutral score
      evaluation = {
        score: 5,
        feedback: 'Evaluation skipped — rubric not found.',
        strengths: [],
        weaknesses: [],
        suggestion: '',
      };
    }

    const entry: KnowledgeBaseEntry = {
      id: randomUUID(),
      department: dept,
      inputHash: _hashOutput(output),
      output,
      score: evaluation.score,
      feedback: evaluation.feedback,
      promptVersion,
      createdAt: new Date().toISOString(),
      tags: [],
    };

    const targetDir = evaluation.score >= 6 ? _goodDir(dept) : _badDir(dept);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, `${entry.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');

    // Check if it's time to refine the prompt (every 10 entries)
    const allEntries = await this._loadAllEntries(dept);
    if (allEntries.length > 0 && allEntries.length % 10 === 0) {
      await this.refinePrompt(dept, promptVersion).catch(() => {
        // Non-fatal — log and continue
        process.stdout.write(
          JSON.stringify({ type: 'kb-refine-skipped', dept, reason: 'refinePrompt failed' }) + '\n'
        );
      });
    }

    return entry;
  }

  /**
   * Evaluates a department output against a rubric file using claude -p.
   * Returns a structured EvaluationResult.
   */
  async evaluate(dept: string, output: string, rubricPath: string): Promise<EvaluationResult> {
    let rubric: string;
    try {
      rubric = await fs.readFile(rubricPath, 'utf-8');
    } catch {
      throw new Error(`Rubric not found at: ${rubricPath}`);
    }

    const prompt = `You are a quality evaluator for a ${dept} department AI agent.

## Rubric
${rubric}

## Output to Evaluate
${output}

## Instructions
Evaluate the output against the rubric. Respond ONLY with valid JSON matching this schema:
{
  "score": <number 0-10>,
  "feedback": "<one sentence summary>",
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "suggestion": "<one actionable improvement>"
}`;

    const result = await this.executor.execute({
      prompt,
      model: EVALUATION_MODEL,
      timeout: 60_000,
    });

    if (result.error || !result.output) {
      throw new Error(`Evaluation call failed: ${result.error ?? 'empty output'}`);
    }

    // Extract JSON from output (may have surrounding text)
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Could not parse evaluation JSON from: ${result.output.slice(0, 200)}`);
    }

    const parsed = _tryParseJSON<EvaluationResult>(jsonMatch[0]);
    if (!parsed) {
      throw new Error(`Invalid JSON in evaluation response.`);
    }

    return parsed;
  }

  /**
   * When entry count is a multiple of 10, reads the last 10 entries,
   * calls claude -p to generate an improved prompt, and saves it as a new version.
   */
  async refinePrompt(dept: string, promptName: string): Promise<void> {
    const entries = await this._loadAllEntries(dept);
    const last10 = entries.slice(-10);

    if (last10.length === 0) return;

    const avgScore = last10.reduce((sum, e) => sum + e.score, 0) / last10.length;
    const weaknesses = last10
      .map((e) => `- Score ${e.score}: ${e.feedback}`)
      .join('\n');

    // Load the current prompt to use as base
    const promptPath = path.join(SRC_DIR, 'departments', dept, 'prompts', `${promptName}.md`);
    let currentPrompt = '';
    try {
      currentPrompt = await fs.readFile(promptPath, 'utf-8');
    } catch {
      currentPrompt = '(No current prompt found)';
    }

    const refinementPrompt = `You are a prompt engineer for a ${dept} AI agent.

## Current Prompt
${currentPrompt}

## Recent Performance (last 10 outputs)
Average score: ${avgScore.toFixed(1)}/10

## Feedback from evaluations:
${weaknesses}

## Task
Generate an improved version of the prompt that addresses the weaknesses above.
Return ONLY the improved prompt text, no explanations.`;

    const result = await this.executor.execute({
      prompt: refinementPrompt,
      model: EVALUATION_MODEL,
      timeout: 120_000,
    });

    if (result.error || !result.output) return;

    const versionsDir = _promptVersionsDir(dept, promptName);
    await fs.mkdir(versionsDir, { recursive: true });

    const version = new Date().toISOString().replace(/[:.]/g, '-');
    const versionData: PromptVersion = {
      version,
      content: result.output,
      createdAt: new Date().toISOString(),
      avgScore,
      sampleCount: last10.length,
    };

    const versionPath = path.join(versionsDir, `${version}.json`);
    await fs.writeFile(versionPath, JSON.stringify(versionData, null, 2), 'utf-8');
  }

  /** Returns aggregate stats for a department's knowledge base. */
  async getStats(dept: string): Promise<KnowledgeBaseStats> {
    const entries = await this._loadAllEntries(dept);
    const avgScore =
      entries.length > 0
        ? entries.reduce((sum, e) => sum + e.score, 0) / entries.length
        : 0;

    const versionsDir = path.join(SRC_DIR, 'departments', dept, 'prompts', 'prompt-versions');
    let promptVersions = 0;
    try {
      const vDirs = await fs.readdir(versionsDir, { withFileTypes: true });
      for (const vDir of vDirs) {
        if (vDir.isDirectory()) {
          const files = await fs.readdir(path.join(versionsDir, vDir.name));
          promptVersions += files.filter((f: string) => f.endsWith('.json')).length;
        }
      }
    } catch {
      promptVersions = 0;
    }

    const lastUpdated =
      entries.length > 0
        ? entries.reduce((latest, e) =>
            e.createdAt > latest.createdAt ? e : latest
          ).createdAt
        : new Date().toISOString();

    return {
      totalEntries: entries.length,
      avgScore,
      promptVersions,
      lastUpdated,
    };
  }

  /** Returns the top N entries sorted by score (highest first). */
  async getBestOutputs(dept: string, n: number): Promise<KnowledgeBaseEntry[]> {
    const entries = await this._loadAllEntries(dept);
    return entries.sort((a, b) => b.score - a.score).slice(0, n);
  }

  /** Loads all KnowledgeBaseEntry JSON files from good-outputs/ and bad-outputs/. */
  private async _loadAllEntries(dept: string): Promise<KnowledgeBaseEntry[]> {
    const dirs = [_goodDir(dept), _badDir(dept)];
    const entries: KnowledgeBaseEntry[] = [];

    for (const dir of dirs) {
      let files: string[];
      try {
        files = await fs.readdir(dir);
      } catch {
        continue;
      }
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const raw = await fs.readFile(path.join(dir, file), 'utf-8');
          const parsed = _tryParseJSON<KnowledgeBaseEntry>(raw);
          if (parsed) entries.push(parsed);
        } catch {
          // Skip malformed files
        }
      }
    }

    return entries;
  }
}
