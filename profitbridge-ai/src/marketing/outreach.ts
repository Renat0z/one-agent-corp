export class OutreachService {
  generateLinkedInMessage(agencyOwnerName: string, agencyName: string): string {
    return `Olá ${agencyOwnerName}, vi o trabalho da ${agencyName} com Shopify.
Notei que muitos clientes de médio porte perdem ~15% do lucro rodando anúncios para SKUs sem estoque. 
Construímos uma IA que pausa isso em tempo real. Se não economizarmos 3x nossa mensalidade, o cliente não paga. 
Pode ser útil para seu portfólio?`;
  }
}
