-- Script de inicialização da tabela de usuários
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de usuários (se ainda não existir)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('Administrador', 'Programador', 'Operador')),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cadastrado_por UUID REFERENCES users(id)
);

-- Criar índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_perfil ON users(perfil);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler todos os usuários
CREATE POLICY "Usuários autenticados podem ler usuários"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas Administradores e Programadores podem inserir usuários
CREATE POLICY "Admin e Programador podem inserir usuários"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.perfil IN ('Administrador', 'Programador')
    )
  );

-- Política: Apenas Administradores e Programadores podem atualizar usuários
CREATE POLICY "Admin e Programador podem atualizar usuários"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.perfil IN ('Administrador', 'Programador')
    )
  );

-- Inserir usuários pré-cadastrados
-- Nota: Estes usuários serão criados com IDs específicos para referência
-- O email será usado para autenticação via Google OAuth

INSERT INTO users (email, nome_completo, perfil, status, data_cadastro)
VALUES 
  ('sbotelho79@gmail.com', 'Administrador', 'Administrador', 'Ativo', NOW()),
  ('acaspiano@gmail.com', 'Programador', 'Programador', 'Ativo', NOW())
ON CONFLICT (email) DO NOTHING;

-- Comentário: Após executar este script, os usuários poderão fazer login
-- usando seus emails Gmail através do botão "Entrar com Google"

