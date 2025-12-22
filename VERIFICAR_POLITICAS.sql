-- Script para verificar e ajustar políticas RLS se necessário
-- Execute este script no SQL Editor do Supabase

-- Verificar se as políticas existem
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- Se não aparecer nenhuma política, execute novamente a parte de políticas do SUPABASE_SETUP.sql

-- Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Se rowsecurity for false, execute:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

