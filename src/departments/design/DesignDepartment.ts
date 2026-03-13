import { BaseMachineDepartment } from '../base-machine-department.js';

export class DesignDepartment extends BaseMachineDepartment {
  constructor() {
    super('design');
  }

  getCapabilities(): string[] {
    return ['brand-identity', 'ui-kit', 'css-tokens', 'landing-page-html', 'color-systems'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'UI/Brand Designer', framework: 'Design Tokens + Apple HIG + Conversion Design' };
  }
}

export const designDepartment = new DesignDepartment();
