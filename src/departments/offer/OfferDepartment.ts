import { BaseMachineDepartment } from '../base-machine-department.js';

export class OfferDepartment extends BaseMachineDepartment {
  constructor() {
    super('offer');
  }

  getCapabilities(): string[] {
    return ['offer-design', 'pricing-strategy', 'value-proposition', 'monetization-model', 'guarantee-design'];
  }

  getDefaultPromptContext(): Record<string, unknown> {
    return { role: 'Offer & Monetization Architect', framework: "Hormozi Value Equation + SaaS Pricing" };
  }
}

export const offerDepartment = new OfferDepartment();
