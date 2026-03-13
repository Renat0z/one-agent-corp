# PRD — profitbridge-offer-design

## PRODUCT REQUIREMENTS DOCUMENT: ProfitBridge AI MVP

### North Star Metric
**Net Arbitrage Spread (NAS):** Total profit generated for users per 24h cycle (minus fees and slippage).

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| **Real-time Spread Engine** | Identifies price discrepancies across 3 top-tier liquidity pools. | L |
| **One-Click Bridge Execution** | Automates the buy/sell sequence to eliminate manual latency/error. | M |
| **Risk Guardrails** | Automated "Kill Switch" if slippage exceeds 0.5% or gas spikes. | S |
| **Performance Dashboard** | Live view of AUM, active trades, and realized PnL. | M |
| **API Webhook Integration** | Connects user wallets/exchange keys securely to the execution logic. | S |

### User Stories (top 3)
1. As an **independent arbitrageur**, I want to **automate spread detection** so that I can **capture opportunities 24/7 without manual monitoring.**
2. As a **liquidity provider**, I want to **set strict slippage limits** so that I can **ensure my principal is protected during high-volatility events.**
3. As a **fund manager**, I want a **centralized PnL dashboard** so that I can **validate the ROI of the bot compared to my manual benchmarks.**

### API Endpoints (REST)
```
POST   /api/bridge/connect    — Link exchange/wallet credentials
GET    /api/bridge/spreads    — Stream live arbitrage opportunities
POST   /api/trades/execute    — Manually trigger or enable auto-pilot
GET    /api/trades/history    — List completed trades and performance
POST   /api/settings/risk     — Update stop-loss and max-slippage params
```

### Data Model
```
Connection {
  id, user_id, provider_type, 
  api_key_enc, status: "active"|"error",
  last_sync_at
}
Trade {
  id, connection_id, pair, 
  side: "buy"|"sell", amount, 
  entry_price, exit_price, net_profit,
  status: "pending"|"completed"|"failed"
}
RiskProfile {
  id, user_id, max_slippage_pct,
  daily_loss_limit, kill_switch_enabled: boolean
}
```

### Success Criteria (MVP done when):
1. **Latency Benchmark:** Execution round-trip (detection to fill) averages <200ms in staging.
2. **Operational Stability:** System maintains 99.9% uptime over a 7-day "Burn-in" period with simulated $50k volume.
3. **User Validation:** 5 Alpha testers successfully execute at least 10 profitable trades each using the "One-Click" interface.