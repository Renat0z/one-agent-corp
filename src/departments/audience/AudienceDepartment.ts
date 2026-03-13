import { BaseMachineDepartment } from '../base-machine-department.js';

export class AudienceDepartment extends BaseMachineDepartment {
  constructor() {
    super('audience');
  }

  getCapabilities(): string[] {
    return ['list-building', 'partnership-outreach', 'jv-engine', 'reactivation', 'icp-definition'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Audience & Partnerships Specialist', framework: 'ICP + JV Framework + Win-Back Sequences' };
  }
}

export const audienceDepartment = new AudienceDepartment();
