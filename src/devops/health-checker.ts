export interface HealthCheckResult {
  healthy: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

export interface ServiceCheck {
  name: string;
  url: string;
}

export class HealthChecker {
  async check(
    url: string,
    retries: number = 5,
    delayMs: number = 2000
  ): Promise<HealthCheckResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: delay * 2^(attempt-1), capped at 30s
        const backoff = Math.min(delayMs * Math.pow(2, attempt - 1), 30000);
        await this.sleep(backoff);
      }

      const result = await this.singleCheck(url);

      if (result.healthy) {
        return result;
      }

      lastError = result.error;
    }

    return {
      healthy: false,
      error: lastError ?? `Health check failed after ${retries + 1} attempts`,
    };
  }

  private async singleCheck(url: string): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'OAC-HealthChecker/1.0' },
        });
      } finally {
        clearTimeout(timeout);
      }

      const responseTime = Date.now() - start;

      if (response.ok) {
        return {
          healthy: true,
          statusCode: response.status,
          responseTime,
        };
      }

      return {
        healthy: false,
        statusCode: response.status,
        responseTime,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    } catch (err) {
      const responseTime = Date.now() - start;
      let errorMessage: string;

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = `Request timed out after 10s`;
        } else {
          errorMessage = err.message;
        }
      } else {
        errorMessage = String(err);
      }

      return {
        healthy: false,
        responseTime,
        error: errorMessage,
      };
    }
  }

  async checkAll(
    services: Array<ServiceCheck>
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    await Promise.all(
      services.map(async (service) => {
        const result = await this.check(service.url, 3, 1000);
        results[service.name] = result.healthy;
      })
    );

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
