import { DecisionLog } from '../engine/monitoring';

export class SavingsAggregator {
  static getMetrics(logs: DecisionLog[]) {
    const totalSaved = logs.reduce((sum, log) => sum + log.estimatedSaving, 0);
    const totalActions = logs.length;
    const itemsPaused = logs.filter(l => l.action === 'PAUSED').length;

    return {
      totalSaved: `$${totalSaved.toLocaleString()}`,
      efficiencyIncrease: "12.5%", // Placeholder de ROI médio
      totalActions,
      itemsPaused
    };
  }
}
