-- ProfitBridge AI - Database Schema (PostgreSQL)
-- Desenvolvido para escala e rastreabilidade de ações de lucro.

-- 1. Usuários e Contas
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'trial', -- trial, active, past_due, canceled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Conexões com Plataformas (OAuth & API Keys)
CREATE TABLE platform_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform_type TEXT NOT NULL, -- 'bling', 'tiny', 'meta_ads', 'google_ads'
    credentials JSONB NOT NULL, -- Tokens criptografados (access_token, refresh_token)
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mapeamento SKU <-> AdSet
-- Esta é a tabela central que o Engine consulta.
CREATE TABLE product_ad_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    ad_platform_id TEXT NOT NULL, -- ID do AdSet (Meta) ou AdGroup (Google)
    platform_type TEXT NOT NULL,
    original_daily_budget INTEGER NOT NULL, -- Armazenado em centavos
    safe_budget_threshold INTEGER DEFAULT 5, -- Abaixo disso, aplica Soft-Cap
    is_sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, sku, ad_platform_id)
);

-- 4. Logs de Ações (Audit Trail)
-- Essencial para provar o ROI ao cliente: "Nós pausamos X e economizamos Y".
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mapping_id UUID REFERENCES product_ad_mappings(id) ON DELETE CASCADE,
    action_performed TEXT NOT NULL, -- 'SOFT_CAP', 'PAUSE', 'RESTORE'
    stock_at_time INTEGER NOT NULL,
    previous_budget INTEGER,
    new_budget INTEGER,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Leads do ROI Calculator
CREATE TABLE calculator_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ad_spend NUMERIC(12,2),
    calculated_leak NUMERIC(12,2),
    data JSONB, -- Armazena todos os inputs da calculadora para análise posterior
    converted_to_user BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_mappings_user ON product_ad_mappings(user_id);
CREATE INDEX idx_logs_mapping ON sync_logs(mapping_id);
CREATE INDEX idx_leads_email ON calculator_leads(email);
