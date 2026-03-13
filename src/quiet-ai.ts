/**
 * quiet-ai.ts
 * Helper compartilhado para chamadas de AI com suporte a --quiet mode.
 *
 * Modo verbose (padrão): streaming completo no terminal (comportamento original)
 * Modo quiet (--quiet):  acumula internamente, exibe apenas pontos de progresso
 *                        → compatível com orquestrador que captura stdout em arquivo
 */

export const QUIET_MODE = !process.argv.includes("--verbose"); // quiet é o padrão

/**
 * Wraps session.subscribe + session.prompt com controle de output.
 *
 * @param session   - instância de AgentSession do pi SDK
 * @param prompt    - prompt a enviar
 * @param label     - label para log de início
 * @returns         - texto completo da resposta
 */
export async function aiCall(session: any, prompt: string, label: string): Promise<string> {
  const startTime = Date.now();
  console.log(`  🤖 ${label}...`);

  const chunks: string[] = [];

  if (QUIET_MODE) {
    // ── Quiet: progresso por pontos, sem streaming de tokens ──────────────
    let accLen = 0;
    const unsub = session.subscribe((e: any) => {
      if (e.type === "message_update" && e.assistantMessageEvent?.type === "text_delta") {
        const d: string = e.assistantMessageEvent.delta ?? "";
        chunks.push(d);
        accLen += d.length;
        if (accLen >= 500) {
          process.stdout.write(".");
          accLen = 0;
        }
      }
    });
    try { await session.prompt(prompt); }
    finally { unsub(); }

    const elapsed    = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalChars = chunks.reduce((s, c) => s + c.length, 0);
    console.log(` ✓ (${totalChars} chars, ${elapsed}s)`);

  } else {
    // ── Verbose: streaming completo (comportamento original) ───────────────
    const unsub = session.subscribe((e: any) => {
      if (e.type === "message_update" && e.assistantMessageEvent?.type === "text_delta") {
        const d: string = e.assistantMessageEvent.delta ?? "";
        process.stdout.write(d);
        chunks.push(d);
      }
    });
    try { await session.prompt(prompt); }
    finally { unsub(); }
    console.log();
  }

  return chunks.join("");
}
