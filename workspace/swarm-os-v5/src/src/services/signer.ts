import { execSync } from 'child_process';

export class SignerService {
    static async sign(hash: string) {
        if (process.env.NODE_ENV === 'test') return `mock-sig-${hash}`;
        
        try {
            // Cosign command: cosign sign-blob --key cosign.key --tlog=false <hash>
            const cmd = `echo -n "${hash}" | cosign sign-blob --key ${process.env.COSIGN_KEY_PATH}cosign.key --tlog=false -`;
            const signature = execSync(cmd, { 
                env: { ...process.env, COSIGN_PASSWORD: process.env.COSIGN_PASSWORD } 
            }).toString().trim();
            return signature;
        } catch (e) {
            console.error("Cosign Error:", e);
            throw new Error("Failed to sign artifact");
        }
    }
}