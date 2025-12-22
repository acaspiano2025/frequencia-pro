# 🔍 Diagnóstico de Problemas de Login

## ✅ Checklist de Verificação

### 1. Verificar se a Tabela Users Existe e Tem Dados

Execute no SQL Editor do Supabase:
```sql
SELECT email, nome_completo, perfil, status FROM users;
```

**Resultado esperado:** Deve mostrar 2 usuários:
- `sbotelho79@gmail.com` - Administrador
- `acaspiano@gmail.com` - Programador

### 2. Verificar Políticas RLS

Execute no SQL Editor:
```sql
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

**Resultado esperado:** Deve mostrar políticas permitindo leitura para `anon` e `authenticated`.

### 3. Executar Script de Correção

Se as políticas não estiverem corretas, execute `AJUSTAR_POLITICAS_RLS.sql`:
- Isso permite que o sistema leia a tabela `users` para validar emails

### 4. Verificar URLs de Callback

No Supabase Dashboard:
- Authentication → URL Configuration
- Verificar se está listado: `https://frequencia-pro.vercel.app/auth/callback`

### 5. Verificar Console do Navegador

Pressione F12 e verifique:
- **Console tab:** Procure por mensagens começando com 🔍, ✅, ❌, ⚠️
- **Network tab:** Verifique se há requisições falhando (vermelho)

## 🐛 Erros Comuns e Soluções

### Erro: "Email não cadastrado"
**Causa:** Email não está na tabela `users`
**Solução:** Execute o INSERT no SQL Editor:
```sql
INSERT INTO users (email, nome_completo, perfil, status)
VALUES ('seu-email@gmail.com', 'Nome', 'Operador', 'Ativo');
```

### Erro: "ERRO RLS: Política bloqueando acesso"
**Causa:** Políticas RLS muito restritivas
**Solução:** Execute `AJUSTAR_POLITICAS_RLS.sql`

### Erro: "Tabela users não existe"
**Causa:** Tabela não foi criada
**Solução:** Execute `SUPABASE_SETUP.sql` completo

### Erro: Callback 500
**Causa:** URL de callback não configurada
**Solução:** Adicione a URL em Authentication → URL Configuration

## 📝 Logs de Depuração

O sistema agora mostra logs detalhados no console:
- 🔍 = Buscando informação
- ✅ = Sucesso
- ❌ = Erro
- ⚠️ = Aviso

Use esses logs para identificar onde está falhando.

