import { BaseMachineDepartment } from '../base-machine-department.js';

export class DevOpsDepartment extends BaseMachineDepartment {
  constructor() {
    super('devops');
  }

  getCapabilities(): string[] {
    return ['docker-builds', 'vps-deploy', 'monitoring-setup', 'ci-cd', 'nginx-config', 'ssl-setup'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'DevOps Engineer', framework: 'Docker + GitHub Actions + Prometheus + Nginx' };
  }
}

export const devopsDepartment = new DevOpsDepartment();
