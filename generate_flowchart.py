import graphviz

def create_flowchart():
    dot = graphviz.Digraph('OneAgentCorp_Workflow', format='png')
    dot.attr(rankdir='TB', size='12,12', overlap='false', splines='ortho')
    
    # Estilização Global
    dot.attr('node', shape='box', style='filled, rounded', fontname='Arial', fontsize='12')
    
    # Definição de Cores por Categoria
    color_ceo = '#e1f5fe' # Light Blue
    color_revenue = '#fff9c4' # Light Yellow
    color_product = '#f3e5f5' # Light Purple
    color_tech = '#e8f5e9' # Light Green
    color_audit = '#ffebee' # Light Red
    color_flow = '#eceff1' # Light Grey

    # Step 0: CEO
    dot.node('S0', 'STEP 0: Diagnóstico e Triagem\n(CEO/Orchestrator)\nDefine Context-Pack', fillcolor=color_ceo)

    # Step 1: Strategy
    dot.node('S1', 'STEP 1: Planejamento Estratégico\n(Dept. Strategy)\nRevenue Hypothesis & Execution Plan', fillcolor=color_revenue)

    # Step 2: Parallel Pre-Build
    with dot.subgraph(name='cluster_step2') as c:
        c.attr(label='STEP 2: PRÉ-BUILD (Paralelo)', style='dashed', fontname='Arial Bold')
        c.node('S2A', 'Audience\n(ICP Name & Pain)', fillcolor=color_revenue)
        c.node('S2B', 'Offer\n(Pricing & Value)', fillcolor=color_revenue)
        c.node('S2C', 'Growth (Pre-Build)\n(Distribution Channel)', fillcolor=color_revenue)

    # Step 3: Product
    dot.node('S3', 'STEP 3: Engenharia de Requisitos\n(Dept. Product)\nPRD & User Stories', fillcolor=color_product)

    # Step 4: Engineering
    dot.node('S4', 'STEP 4: Execução Técnica\n(Dept. Engineering)\nTopological Mapping & Implementation', fillcolor=color_tech)

    # Step 5: QA & Audit
    dot.node('S5', 'STEP 5: Avaliação e Auditoria\n(Dept. QA & Audit)\nCommercial Readiness Audit', fillcolor=color_audit)

    # Step 6: Deploy
    dot.node('S6', 'STEP 6: Deploy & Distribuição\n(DevOps + Growth)\nActive Channel Activation', fillcolor=color_tech)

    # Step 7: MRR Gate
    dot.node('S7', 'STEP 7: MRR Review Gate\n(Dept. Flow Intelligence)\nDecision: SCALE / OPTIMIZE / KILL', fillcolor=color_flow)

    # Step 8: Flow Intelligence
    dot.node('S8', 'STEP 8: Inteligência de Fluxo\n(Dept. Flow Intelligence)\nBottleneck Analysis & ACID Actions', fillcolor=color_flow)

    # Conexões
    dot.edge('S0', 'S1')
    dot.edge('S1', 'S2A')
    dot.edge('S1', 'S2B')
    dot.edge('S1', 'S2C')
    
    dot.edge('S2A', 'S3')
    dot.edge('S2B', 'S3')
    dot.edge('S2C', 'S3')
    
    dot.edge('S3', 'S4')
    dot.edge('S4', 'S5')
    dot.edge('S5', 'S6')
    dot.edge('S6', 'S7')
    dot.edge('S7', 'S8')
    
    # Loop de Retroalimentação (The 10X Loop)
    dot.edge('S8', 'S0', label=' Update context.json\n(New Bottleneck/Priority)', color='red', fontcolor='red', style='bold')

    # Renderização
    dot.render('workflow_one_agent_corp', cleanup=True)
    print("Flowchart generated as workflow_one_agent_corp.png")

if __name__ == "__main__":
    create_flowchart()
