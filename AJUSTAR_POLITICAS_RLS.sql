-- Script para ajustar políticas RLS e permitir que o sistema funcione
-- Execute este script no SQL Editor do Supabase

-- IMPORTANTE: Este script ajusta as políticas para permitir que o sistema
-- possa validar emails durante o login, mesmo sem estar autenticado ainda

-- 1. Remover a política restritiva atual e criar uma mais permissiva
-- Esta política permite que o sistema verifique se um email está cadastrado
-- mesmo antes do usuário estar autenticado (necessário para validação no login)

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Usuários autenticados podem ler usuários" ON users;
DROP POLICY IF EXISTS "Permitir leitura de usuários para validação" ON users;

-- Criar nova política que permite leitura para anon e authenticated
-- Isso é necessário para validar emails durante o login
CREATE POLICY "Permitir leitura de usuários para validação"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Verificar se a política anterior de leitura está muito restritiva
-- Se necessário, podemos ajustar a política existente

-- 3. Verificar se os usuários estão realmente cadastrados
SELECT 
  email,
  nome_completo,
  perfil,
  status,
  data_cadastro
FROM users
ORDER BY data_cadastro;

-- 4. Se os usuários não aparecerem, execute novamente o INSERT:
-- INSERT INTO users (email, nome_completo, perfil, status, data_cadastro)
-- VALUES 
--   ('sbotelho79@gmail.com', 'Administrador', 'Administrador', 'Ativo', NOW()),
--   ('acaspiano@gmail.com', 'Programador', 'Programador', 'Ativo', NOW())
-- ON CONFLICT (email) DO UPDATE
-- SET 
--   nome_completo = EXCLUDED.nome_completo,
--   perfil = EXCLUDED.perfil,
--   status = EXCLUDED.status;

