import { db } from './schema';

export function saveSpread(data: any) {
    const stmt = db.prepare('INSERT INTO spreads (asset, poolA, poolB, spread) VALUES (?, ?, ?, ?)');
    stmt.run(data.asset, data.poolA, data.poolB, data.spread);
}

export function getLatestSpreads(limit = 10) {
    return db.prepare('SELECT * FROM spreads ORDER BY timestamp DESC LIMIT ?').all(limit);
}

export function logTrade(trade: any) {
    const stmt = db.prepare('INSERT INTO trades (id, asset, amount, profit, status) VALUES (?, ?, ?, ?, ?)');
    stmt.run(trade.id, trade.asset, trade.amount, trade.profit, trade.status);
}