import { BaseMachineDepartment } from '../base-machine-department.js';

export class StrategyDepartment extends BaseMachineDepartment {
  constructor() {
    super('strategy');
  }

  getCapabilities(): string[] {
    return ['execution-planning', 'theory-of-constraints', 'risk-assessment', 'resource-allocation'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Chief Strategy Officer', framework: 'Principles (Dalio) + Constraints (Goldratt) + Competitive Strategy (Porter)' };
  }
}

export const strategyDepartment = new StrategyDepartment();
