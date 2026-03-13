import { sqlite } from './schema.js';

export const db = {
    saveArtifact: (data: any) => {
        const stmt = sqlite.prepare(`
            INSERT INTO artifacts (hash, source_agent_id, status, signature_id) 
            VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(data.hash, data.source_agent_id, data.status, data.signature_id);
        return result.lastInsertRowid;
    },

    saveValidation: (data: any) => {
        const stmt = sqlite.prepare(`
            INSERT INTO validation_results (artifact_id, intent_match_score, policy_verdict, raw_log) 
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(data.artifact_id, data.intent_match_score, data.policy_verdict, data.raw_log);
    },

    getArtifact: (id: string) => {
        return sqlite.prepare(`
            SELECT a.*, v.intent_match_score, v.policy_verdict 
            FROM artifacts a 
            LEFT JOIN validation_results v ON a.id = v.artifact_id 
            WHERE a.id = ?
        `).get(id);
    }
};