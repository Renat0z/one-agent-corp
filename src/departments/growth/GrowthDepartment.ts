import { BaseMachineDepartment } from '../base-machine-department.js';

export class GrowthDepartment extends BaseMachineDepartment {
  constructor() {
    super('growth');
  }

  getCapabilities(): string[] {
    return ['landing-page-copy', 'email-sequences', 'ad-copy', 'funnel-design', 'ice-scoring', 'growth-loops'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Growth Hacker', framework: 'Sean Ellis PMF + ICE Scoring + AARRR Funnel' };
  }
}

export const growthDepartment = new GrowthDepartment();
