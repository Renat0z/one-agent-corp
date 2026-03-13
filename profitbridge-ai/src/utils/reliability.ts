export class ReliabilityWrapper {
  static async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      console.warn(`[Retry] Falha detectada. Tentando novamente em ${delay}ms... (${retries} restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(fn, retries - 1, delay * 2);
    }
  }
}

export class ShadowModeGuard {
  constructor(private isShadowMode: boolean) {}

  async execute(actionName: string, executionFn: () => Promise<void>) {
    if (this.isShadowMode) {
      console.log(`[ShadowMode] SIMULANDO AÇÃO: ${actionName}`);
      return;
    }
    await executionFn();
  }
}
