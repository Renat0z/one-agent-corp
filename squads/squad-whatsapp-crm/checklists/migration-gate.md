# CHECKLIST: WhatsApp CRM Migration Gate
# Squad: squad-whatsapp-crm

- [ ] Arquivo `workspace/whatsapp-crm-swarm/src/src/server.ts` existe.
- [ ] Banco de dados SQLite/Drizzle inicializado.
- [ ] Evolution API acessível (URL/Global-Token configurados no .env).
- [ ] Schema de Leads em `queries.ts` validado.
- [ ] Scheduler configurado para ciclos de 5 minutos.
