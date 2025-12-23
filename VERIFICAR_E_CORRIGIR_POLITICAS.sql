-- Script para verificar e corrigir políticas RLS
-- Execute este script no SQL Editor do Supabase
-- Este script remove todas as políticas existentes e cria uma nova corretamente

-- 1. Remover TODAS as políticas de SELECT existentes na tabela users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND cmd = 'SELECT')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', r.policyname);
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
END $$;

-- 2. Criar nova política que permite leitura para anon e authenticated
-- Isso é necessário para validar emails durante o login
CREATE POLICY "Permitir leitura de usuários para validação"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Verificar se a política foi criada corretamente
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users';

-- 4. Verificar se os usuários estão cadastrados
SELECT 
  email,
  nome_completo,
  perfil,
  status,
  data_cadastro
FROM users
ORDER BY data_cadastro;

-- Se você ver a política "Permitir leitura de usuários para validação" e os 2 usuários,
-- está tudo correto! ✅




