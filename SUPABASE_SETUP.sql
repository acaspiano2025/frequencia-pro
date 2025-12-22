-- ============================================
-- Script de Configuração do Banco de Dados
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('Administrador', 'Programador', 'Operador')),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cadastrado_por UUID REFERENCES users(id)
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_perfil ON users(perfil);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança

-- Política: Usuários autenticados podem ler todos os usuários
DROP POLICY IF EXISTS "Usuários autenticados podem ler usuários" ON users;
CREATE POLICY "Usuários autenticados podem ler usuários"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas Administradores e Programadores podem inserir usuários
DROP POLICY IF EXISTS "Admin e Programador podem inserir usuários" ON users;
CREATE POLICY "Admin e Programador podem inserir usuários"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.perfil IN ('Administrador', 'Programador')
      AND users.status = 'Ativo'
    )
  );

-- Política: Apenas Administradores e Programadores podem atualizar usuários
DROP POLICY IF EXISTS "Admin e Programador podem atualizar usuários" ON users;
CREATE POLICY "Admin e Programador podem atualizar usuários"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.perfil IN ('Administrador', 'Programador')
      AND users.status = 'Ativo'
    )
  );

-- 5. Inserir usuários pré-cadastrados
-- IMPORTANTE: Estes emails devem corresponder aos emails Gmail usados para login

INSERT INTO users (email, nome_completo, perfil, status, data_cadastro)
VALUES 
  ('sbotelho79@gmail.com', 'Administrador', 'Administrador', 'Ativo', NOW()),
  ('acaspiano@gmail.com', 'Programador', 'Programador', 'Ativo', NOW())
ON CONFLICT (email) DO UPDATE
SET 
  nome_completo = EXCLUDED.nome_completo,
  perfil = EXCLUDED.perfil,
  status = EXCLUDED.status;

-- 6. Verificar se os usuários foram criados
SELECT 
  email,
  nome_completo,
  perfil,
  status,
  data_cadastro
FROM users
ORDER BY data_cadastro;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Após executar este script, os usuários poderão fazer login
--    usando seus emails Gmail através do botão "Entrar com Google"
--
-- 2. Certifique-se de que os emails estão corretos e correspondem
--    aos emails Gmail que serão usados para autenticação
--
-- 3. Apenas usuários com status 'Ativo' podem fazer login
--
-- 4. Apenas Administradores e Programadores podem cadastrar
--    novos operadores através do menu no Dashboard

