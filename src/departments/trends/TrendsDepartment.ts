import { BaseMachineDepartment } from '../base-machine-department.js';

export class TrendsDepartment extends BaseMachineDepartment {
  constructor() {
    super('trends');
  }

  getCapabilities(): string[] {
    return ['market-research', 'jtbd-analysis', 'opportunity-scoring', 'competitor-mapping'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Trends & Intelligence Analyst', framework: 'JTBD + Blue Ocean + TAM/SAM/SOM' };
  }
}

export const trendsDepartment = new TrendsDepartment();
