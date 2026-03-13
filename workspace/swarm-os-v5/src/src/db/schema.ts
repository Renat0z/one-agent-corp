import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || './guard.db';
export const sqlite = new Database(dbPath);

export async function initDB() {
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS artifacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT NOT NULL,
            source_agent_id TEXT,
            status TEXT,
            signature_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS validation_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            artifact_id INTEGER,
            intent_match_score REAL,
            policy_verdict TEXT,
            raw_log TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(artifact_id) REFERENCES artifacts(id)
        );

        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            rego_content TEXT,
            active INTEGER DEFAULT 1
        );
    `);
}