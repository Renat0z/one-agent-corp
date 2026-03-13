import { ClientInteractionHub } from './client-interaction';

const hub = new ClientInteractionHub();

console.log('--- SIMULANDO FLUXO DE VENDAS 100% IA ---\n');

console.log('1. Cliente pergunta sobre segurança:');
hub.handleObjection('security');

console.log('\n2. Enviando a Oferta Grand Slam:');
hub.sendOffer('loja-do-pedro');

console.log('\n3. Cliente assinou! Relatório de 7 dias depois:');
hub.notifySuccess('Pedro', 1450);
