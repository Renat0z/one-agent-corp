import { BaseMachineDepartment } from '../base-machine-department.js';

export class ProductDepartment extends BaseMachineDepartment {
  constructor() {
    super('product');
  }

  getCapabilities(): string[] {
    return ['prd-writing', 'user-stories', 'roadmap', 'jtbd-requirements', 'feature-prioritization'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'VP of Product', framework: 'JTBD + Dual-Track Agile + ICE Scoring' };
  }
}

export const productDepartment = new ProductDepartment();
