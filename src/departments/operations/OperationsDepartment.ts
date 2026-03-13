import { BaseMachineDepartment } from '../base-machine-department.js';

export class OperationsDepartment extends BaseMachineDepartment {
  constructor() {
    super('operations');
  }

  getCapabilities(): string[] {
    return ['burn-rate', 'compliance', 'cost-optimization', 'financial-modeling', 'unit-economics'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'COO / Finance', framework: 'Unit Economics + SaaS P&L + GDPR/CCPA Compliance' };
  }
}

export const operationsDepartment = new OperationsDepartment();
