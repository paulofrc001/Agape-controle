-- Script para configurar o Supabase corretamento (Copie e cole no SQL Editor do Supabase)

-- 1. Criar Tabelas
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  symbolic_name TEXT,
  phone TEXT,
  password TEXT,
  is_present BOOLEAN DEFAULT FALSE,
  check_in_time TIMESTAMPTZ,
  consumption JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agape_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_data JSONB NOT NULL,
  participants_data JSONB NOT NULL,
  finalized_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_config (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  store_name TEXT,
  logo_url TEXT,
  admin_email TEXT,
  admin_password TEXT DEFAULT 'agape777',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RESOLVER ERRO 42501 (RLS): Escolha UMA das opções abaixo e execute:

-- OPÇÃO A: Desativar RLS (Mais rápido para desenvolvimento)
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE agape_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_config DISABLE ROW LEVEL SECURITY;

-- OPÇÃO B: Criar Políticas de Acesso (Mais seguro)
-- Execute estas se preferir manter o RLS ativado:
-- CREATE POLICY "Acesso Total Anonimo" ON participants FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Acesso Total Anonimo" ON agape_history FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Acesso Total Anonimo" ON event_config FOR ALL USING (true) WITH CHECK (true);

-- 3. Inserir configuração inicial
INSERT INTO event_config (id, name, date, store_name, admin_password)
VALUES ('current', 'Novo Ágape', NOW(), 'Augusta e Respeitável Loja Simbólica', 'agape777')
ON CONFLICT (id) DO NOTHING;
