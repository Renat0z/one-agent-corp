import { BaseMachineDepartment } from '../base-machine-department.js';

export class CompetitiveDepartment extends BaseMachineDepartment {
  constructor() {
    super('competitive');
  }

  getCapabilities(): string[] {
    return ['five-forces', 'positioning', 'moat-analysis', 'battle-cards', 'blue-ocean'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Competitive Intelligence Analyst', framework: "Porter's Five Forces + Blue Ocean + Moat Analysis" };
  }
}

export const competitiveDepartment = new CompetitiveDepartment();
