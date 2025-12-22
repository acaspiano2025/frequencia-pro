# 🔧 Resolver Problema de Login

## ⚠️ Problema Identificado

As políticas RLS (Row Level Security) estão bloqueando a leitura da tabela `users` durante a validação do login. Isso impede que o sistema verifique se o email está cadastrado.

## ✅ Solução Rápida

### Passo 1: Ajustar Políticas RLS no Supabase

1. **Acesse o Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New Query"

3. **Execute o Script:**
   - Abra o arquivo `AJUSTAR_POLITICAS_RLS.sql`
   - Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
   - Cole no SQL Editor (Ctrl+V)
   - Clique em "Run" (Ctrl+Enter)

4. **Verifique o Resultado:**
   - Deve aparecer uma mensagem de sucesso
   - Deve mostrar os 2 usuários na tabela

### Passo 2: Testar o Login

1. **Recarregue o aplicativo:**
   - No navegador, pressione F5 ou Ctrl+R
   - Ou acesse: http://localhost:8082

2. **Tente fazer login:**
   - Clique em "Entrar com Google"
   - Use um dos emails cadastrados:
     - `sbotelho79@gmail.com`
     - `acaspiano@gmail.com`

3. **Verifique:**
   - Se funcionar, você será redirecionado para o Dashboard
   - Se ainda der erro, verifique o console do navegador (F12)

## 🔍 Verificar se Funcionou

Após executar o script, verifique no console do navegador (F12 → Console):
- Se aparecer "❌ ERRO RLS", as políticas ainda estão bloqueando
- Se não aparecer erro, o login deve funcionar

## 📋 O que o Script Faz

O script `AJUSTAR_POLITICAS_RLS.sql`:
- ✅ Remove a política restritiva atual
- ✅ Cria uma nova política que permite leitura para validação
- ✅ Permite que o sistema verifique emails mesmo sem estar autenticado
- ✅ Mantém a segurança para outras operações

## 🆘 Se Ainda Não Funcionar

1. **Verifique o console do navegador (F12):**
   - Procure por erros em vermelho
   - Copie as mensagens de erro

2. **Verifique as URLs de callback:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Certifique-se de que `http://localhost:8082/auth/callback` está listada

3. **Verifique se os usuários estão cadastrados:**
   - Execute no SQL Editor: `SELECT * FROM users;`
   - Deve mostrar os 2 usuários

## ✅ Checklist

- [ ] Script `AJUSTAR_POLITICAS_RLS.sql` executado no Supabase
- [ ] URLs de callback configuradas no Supabase
- [ ] Usuários cadastrados na tabela `users`
- [ ] Aplicativo recarregado no navegador
- [ ] Teste de login realizado

