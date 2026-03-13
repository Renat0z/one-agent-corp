import { ClaudeExecutor } from '../executor/claude-executor.js';
import { FileManager } from '../executor/file-manager.js';
import { PromptFactory } from '../executor/prompt-factory.js';
import { KnowledgeBaseEngine } from '../knowledge-base/knowledge-base-engine.js';

export abstract class BaseMachineDepartment {
  readonly departmentId: string;
  protected executor: ClaudeExecutor;
  protected fileManager: FileManager;
  protected promptFactory: PromptFactory;
  protected knowledgeBase: KnowledgeBaseEngine;
  protected defaultModel: string;

  constructor(departmentId: string) {
    this.departmentId = departmentId;
    this.executor = new ClaudeExecutor();
    this.fileManager = new FileManager();
    this.promptFactory = new PromptFactory();
    this.knowledgeBase = new KnowledgeBaseEngine();
    this.defaultModel = process.env['CLAUDE_MODEL_DEFAULT'] ?? 'claude-sonnet-4-6';
  }

  async executeReal(
    task: string,
    projectId: string,
    context?: Record<string, unknown>,
  ): Promise<string> {
    const prompt = await this.promptFactory
      .build(this.departmentId, 'main', { task, projectId, ...context })
      .catch(
        () =>
          `You are the ${this.departmentId} department of One Agent Corp — a micro-SaaS factory.\n\nTask: ${task}\nProject: ${projectId}\n\nDeliver structured, actionable output.`,
      );

    const result = await this.executor.execute({
      prompt,
      model: this.defaultModel,
      timeout: 300_000,
      projectId,
    });

    if (result.success && result.output) {
      await this.knowledgeBase.saveOutput(this.departmentId, result.output, 'v1').catch(() => {});
    }

    return result.output ?? result.error ?? 'No output';
  }

  abstract getCapabilities(): string[];
  abstract getDefaultPromptContext(): Record<string, unknown>;
}
