import { Router } from 'express';
import { ScannerService } from '../services/scanner.js';
import { SignerService } from '../services/signer.js';
import { PolicyEngine } from '../services/policy-engine.js';
import { db } from '../db/repository.js';

const router = Router();

router.post('/scan', async (req, res) => {
    const { artifact_hash, task_context, file_diff, source_agent_id } = req.body;

    try {
        // 1. Intent Matching (LLM)
        const intentResult = await ScannerService.matchIntent(task_context, file_diff);
        
        // 2. Policy Check (OPA)
        const policyResult = await PolicyEngine.evaluate(file_diff);

        const isValid = intentResult.score >= 0.8 && policyResult.passed;
        let signature = null;

        if (isValid) {
            signature = await SignerService.sign(artifact_hash);
        }

        const artifactId = db.saveArtifact({
            hash: artifact_hash,
            source_agent_id,
            status: isValid ? 'signed' : 'quarantined',
            signature_id: signature
        });

        db.saveValidation({
            artifact_id: artifactId,
            intent_match_score: intentResult.score,
            policy_verdict: isValid ? 'pass' : 'fail',
            raw_log: JSON.stringify({ intentResult, policyResult })
        });

        res.json({
            id: artifactId,
            status: isValid ? 'signed' : 'quarantined',
            score: intentResult.score,
            signed: !!signature,
            reasons: policyResult.violations
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', (req, res) => {
    const artifact = db.getArtifact(req.params.id);
    artifact ? res.json(artifact) : res.status(404).json({ error: 'Not found' });
});

export const artifactRoutes = router;