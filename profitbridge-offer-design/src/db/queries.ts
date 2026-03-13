import db from './schema';

export const Queries = {
  // Mock Arbitrage Spread Insertion
  insertSpread: (pair: string, spread_pct: number, pool: string) => {
    return db.prepare('INSERT INTO spreads (pair, spread_pct, liquidity_pool) VALUES (?, ?, ?)')
      .run(pair, spread_pct, pool);
  },

  // Get Top Spreads
  getTopSpreads: (limit: number = 5) => {
    return db.prepare('SELECT * FROM spreads ORDER BY spread_pct DESC LIMIT ?').all(limit);
  },

  // Record Trade Execution
  recordTrade: (pair: string, amount: number, side: 'BUY' | 'SELL') => {
    return db.prepare('INSERT INTO trades (pair, amount, side, status) VALUES (?, ?, ?, ?)')
      .run(pair, amount, side, 'EXECUTED');
  },

  // Get Trade History
  getTradeHistory: () => {
    return db.prepare('SELECT * FROM trades ORDER BY executed_at DESC LIMIT 20').all();
  }
};
