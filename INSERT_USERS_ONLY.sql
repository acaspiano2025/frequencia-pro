-- Script para inserir apenas os usuários pré-cadastrados
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: Execute apenas se a tabela users já foi criada

-- Inserir usuários pré-cadastrados
-- Usando ON CONFLICT para evitar duplicatas
INSERT INTO users (email, nome_completo, perfil, status, data_cadastro)
VALUES 
  ('sbotelho79@gmail.com', 'Administrador', 'Administrador', 'Ativo', NOW()),
  ('acaspiano@gmail.com', 'Programador', 'Programador', 'Ativo', NOW())
ON CONFLICT (email) DO UPDATE
SET 
  nome_completo = EXCLUDED.nome_completo,
  perfil = EXCLUDED.perfil,
  status = EXCLUDED.status;

-- Verificar se os usuários foram inseridos
SELECT 
  email,
  nome_completo,
  perfil,
  status,
  data_cadastro
FROM users
ORDER BY data_cadastro;

-- Se você vir os dois usuários na lista acima, está tudo certo! ✅

