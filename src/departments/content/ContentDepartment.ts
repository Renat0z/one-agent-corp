import { BaseMachineDepartment } from '../base-machine-department.js';

export class ContentDepartment extends BaseMachineDepartment {
  constructor() {
    super('content');
  }

  getCapabilities(): string[] {
    return ['seo-content', 'blog-posts', 'documentation', 'keyword-research', 'content-calendar'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Content Strategist + SEO Specialist', framework: 'Topic Clusters + E-E-A-T + Search Intent' };
  }
}

export const contentDepartment = new ContentDepartment();
