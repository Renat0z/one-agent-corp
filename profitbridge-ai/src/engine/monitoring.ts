export interface DecisionLog {
  timestamp: string;
  skuId: string;
  action: 'PAUSED' | 'BID_ADJUSTED' | 'NONE';
  reason: string;
  estimatedSaving: number;
}

export class MonitoringService {
  private logs: DecisionLog[] = [];

  logDecision(log: DecisionLog) {
    this.logs.push(log);
    console.log(`[Monitor] ${log.timestamp} | ${log.skuId} | ${log.action} | Saving: $${log.estimatedSaving}`);
  }

  getTotalSavings(): number {
    return this.logs.reduce((sum, log) => sum + log.estimatedSaving, 0);
  }

  getRecentLogs(limit = 10) {
    return this.logs.slice(-limit);
  }
}
