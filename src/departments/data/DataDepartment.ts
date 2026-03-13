import { BaseMachineDepartment } from '../base-machine-department.js';

export class DataDepartment extends BaseMachineDepartment {
  constructor() {
    super('data');
  }

  getCapabilities(): string[] {
    return ['analytics-queries', 'dashboards', 'reports', 'predictions', 'cohort-analysis'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Data Analyst', framework: 'SaaS Metrics + Cohort Analysis + Predictive Modeling' };
  }
}

export const dataDepartment = new DataDepartment();
