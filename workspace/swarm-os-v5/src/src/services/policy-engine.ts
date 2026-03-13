import { execSync } from 'child_process';
import fs from 'fs';

export class PolicyEngine {
    static async evaluate(content: string) {
        const tempPath = `/tmp/check-${Date.now()}.txt`;
        fs.writeFileSync(tempPath, content);

        try {
            // Simulated OPA check via simple regex/grep for MVP
            // In production: opa eval -d policies/ -input input.json
            const forbidden = ["eval(", "exec(", "process.env.SECRET"];
            const violations = forbidden.filter(token => content.includes(token));

            return {
                passed: violations.length === 0,
                violations: violations.map(v => `Forbidden token found: ${v}`)
            };
        } finally {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
}