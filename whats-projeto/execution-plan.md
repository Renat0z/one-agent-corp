# Execution Plan — WhatsApp CRM Swarm

## Visão Estratégica (Porter · Dalio · Goldratt)

### Análise de Mercado (Porter)
- **Vantagem Competitiva:** Foco em funis de conversão automatizados (não apenas chat) e integração profunda com APIs de WhatsApp estáveis (Evolution API).
- **Segmentação:** PMEs e Freelancers de alto volume de leads.

### Teoria das Restrições (Goldratt)
- **Gargalo Identificado:** Estabilidade da conexão WhatsApp (QR Code / Session) e gerenciamento de limites de taxa (rate limits).
- **Ação:** Implementação de fila de mensagens (BullMQ/Redis) e monitoramento de saúde de instância em tempo real.

### Princípios de Execução (Dalio)
- **Iteração Radical:** Lançar MVP funcional em 3 ciclos swarm.
- **Transparência Técnica:** Log de todas as falhas de conexão no painel admin.

## Decomposição de Tarefas (WBS)

### Ciclo 1: Core Connectivity & Lead Capture (Ativo)
1. **S-1.1:** Mapeamento de Arquitetura (Evolution API Integration).
2. **S-1.2:** Definição de Data Models (Leads, Funnels, Messages).
3. **S-1.3:** Setup de Infraestrutura (Docker, DB, Redis).

### Ciclo 2: Automation Engine
1. **S-2.1:** Workflow Builder (Lógica de IF/ELSE baseada em triggers).
2. **S-2.2:** Engine de Mensagens Agendadas.
3. **S-2.3:** Dashboard de Conversão.


