import { BaseMachineDepartment } from '../base-machine-department.js';

export class QADepartment extends BaseMachineDepartment {
  constructor() {
    super('qa');
  }

  getCapabilities(): string[] {
    return ['test-writing', 'e2e-testing', 'security-scanning', 'bug-reporting', 'owasp-review'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'QA Engineer', framework: 'Jest + Playwright + OWASP Top 10' };
  }
}

export const qaDepartment = new QADepartment();
