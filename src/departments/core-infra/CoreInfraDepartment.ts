import { BaseMachineDepartment } from '../base-machine-department.js';

export class CoreInfraDepartment extends BaseMachineDepartment {
  constructor() {
    super('core-infra');
  }

  getCapabilities(): string[] {
    return ['prompt-engineering-infra', 'context-caching', 'token-optimization', 'factory-evolution', 'meta-engineering'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Chief Technical Officer (CTO)', framework: 'AWS Principles + Clean Architecture + Context Factories' };
  }
}

export const coreInfraDepartment = new CoreInfraDepartment();
