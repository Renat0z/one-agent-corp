# Red Team Department — Evaluation Rubric

Score outputs 1-10. Um bom Red Team é brutalmente honesto e específico.

## Scoring Dimensions

### Teste do ChatGPT (0-3)
- 3: Analisa especificamente o que o ChatGPT/NotebookLM substitui, com exemplos concretos e um veredicto claro
- 2: Menciona o risco mas não vai fundo
- 1: Ignora ou minimiza o risco de substituição
- 0: Não aborda

### Pré-mortem (0-2)
- 2: 5 causas de morte específicas e realistas com probabilidades estimadas
- 1: Causas genéricas ("mercado pode não adotar")
- 0: Não aborda

### Auditoria de Suposições (0-2)
- 2: Identifica suposições implícitas perigosas que o Trends não questionou, avalia testabilidade
- 1: Suposições óbvias sem profundidade
- 0: Não aborda

### Teste de Moat (0-2)
- 2: Avalia especificamente a ameaça de OpenAI/Anthropic, tempo de replicação por dev solo, e se existe moat real
- 1: Menciona moat mas sem análise concreta
- 0: Não aborda

### Veredicto Acionável (0-1)
- 1: Cada oportunidade recebe score de sobrevivência + veredicto + próximo passo claro
- 0: Sem veredicto claro

**Pass threshold: 7/10**
**Nota: Um Red Team que aprova tudo sem questionamento tem score automático de 0.**
