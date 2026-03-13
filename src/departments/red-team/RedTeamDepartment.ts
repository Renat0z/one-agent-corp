import { BaseMachineDepartment } from '../base-machine-department.js';

export class RedTeamDepartment extends BaseMachineDepartment {
  constructor() {
    super('red-team');
  }

  getCapabilities(): string[] {
    return [
      'viability-stress-test',
      'chatgpt-substitution-test',
      'unit-economics-death-scenario',
      'assumption-audit',
      'pre-mortem-analysis',
      'moat-absence-test',
    ];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return {
      role: 'Devil\'s Advocate / Red Team Analyst',
      framework: 'Pre-mortem + Assumption Audit + Substitution Test',
    };
  }
}

export const redTeamDepartment = new RedTeamDepartment();
