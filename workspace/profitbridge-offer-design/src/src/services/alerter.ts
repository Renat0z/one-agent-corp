export function notifySpread(asset: string, spread: number) {
    if (spread > 1.5) {
        console.log(`[ALERT] High spread detected for ${asset}: ${spread.toFixed(2)}%`);
        // Integration point for Webhooks/Telegram could be added here
    }
}