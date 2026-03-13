import { BaseMachineDepartment } from '../base-machine-department.js';

export class EngineeringDepartment extends BaseMachineDepartment {
  constructor() {
    super('engineering');
  }

  getCapabilities(): string[] {
    return ['code-generation', 'api-design', 'database-schema', 'nextjs-scaffolding', 'typescript', 'prisma'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Senior Full-Stack Engineer', framework: 'Next.js + TypeScript + Prisma + PostgreSQL' };
  }
}

export const engineeringDepartment = new EngineeringDepartment();
