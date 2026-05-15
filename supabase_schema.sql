-- Script para criar as tabelas no Supabase

-- 1. Tabela de Participantes
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Irmão', 'Cunhada', 'Sobrinho', 'Convidado'
  symbolic_name TEXT,
  phone TEXT,
  password TEXT,
  is_present BOOLEAN DEFAULT FALSE,
  check_in_time TIMESTAMPTZ,
  consumption JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Histórico
CREATE TABLE agape_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_data JSONB NOT NULL,
  participants_data JSONB NOT NULL,
  finalized_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Configuração do Evento
CREATE TABLE event_config (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  store_name TEXT,
  logo_url TEXT,
  admin_email TEXT,
  admin_password TEXT DEFAULT 'agape777',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração inicial
INSERT INTO event_config (id, name, date, store_name, admin_password)
VALUES ('current', 'Novo Ágape', NOW(), 'Augusta e Respeitável Loja Simbólica', 'agape777')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS (Opcional, mas recomendado para produção)
-- ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agape_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples para anon (Substitua por algo mais robusto se necessário)
-- CREATE POLICY "Permitir tudo para anon" ON participants FOR ALL USING (true);
-- CREATE POLICY "Permitir tudo para anon" ON agape_history FOR ALL USING (true);
-- CREATE POLICY "Permitir tudo para anon" ON event_config FOR ALL USING (true);
