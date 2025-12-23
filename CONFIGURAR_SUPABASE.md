# 🔧 Configuração do Supabase para OAuth

## ⚠️ ERRO 500 no Callback - Solução

Se você está vendo o erro `{"code":500,"error_code": "unexpected_failure"}` no callback do OAuth, siga estes passos:

### 1. Configurar URLs de Redirecionamento no Supabase

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** → **URL Configuration**
4. Em **Redirect URLs**, adicione as seguintes URLs:

**Para Desenvolvimento (Local):**
```
http://localhost:8082/auth/callback
http://localhost:8081/auth/callback
http://127.0.0.1:8082/auth/callback
```

**Para Produção:**
```
https://frequencia-pro.vercel.app/auth/callback
```

5. Clique em **Save**

### 2. Criar a Tabela de Usuários

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo completo do arquivo `SUPABASE_SETUP.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Verifique se a mensagem de sucesso aparece

### 3. Verificar se os Usuários Foram Criados

Execute esta query no SQL Editor:

```sql
SELECT email, nome_completo, perfil, status 
FROM users 
ORDER BY data_cadastro;
```

Você deve ver:
- `sbotelho79@gmail.com` (Administrador)
- `acaspiano@gmail.com` (Programador)

### 4. Configurar Google OAuth Provider

1. No Supabase Dashboard, vá em **Authentication** → **Providers**
2. Certifique-se de que **Google** está habilitado
3. Configure as credenciais do Google OAuth (se ainda não estiver configurado):
   - **Client ID** (do Google Cloud Console)
   - **Client Secret** (do Google Cloud Console)

### 5. Verificar Logs do Supabase

Se o erro persistir:
1. Vá em **Logs** → **API Logs** no Supabase Dashboard
2. Procure por erros relacionados ao callback
3. Verifique se há mensagens sobre a tabela `users` não encontrada

## ✅ Checklist de Configuração

- [ ] URLs de redirecionamento configuradas no Supabase
- [ ] Tabela `users` criada (execute `SUPABASE_SETUP.sql`)
- [ ] Usuários pré-cadastrados criados
- [ ] Google OAuth Provider configurado
- [ ] Políticas RLS configuradas corretamente

## 🔍 Testando

Após configurar tudo:

1. Acesse o aplicativo: http://localhost:8082
2. Clique em "Entrar com Google"
3. Faça login com um dos emails cadastrados:
   - `sbotelho79@gmail.com`
   - `acaspiano@gmail.com`
4. O sistema deve redirecionar corretamente após o login

## 🆘 Problemas Comuns

### Erro 500 no Callback
- **Causa**: URL de callback não configurada
- **Solução**: Adicione as URLs em Authentication → URL Configuration

### "Tabela users não existe"
- **Causa**: Script SQL não foi executado
- **Solução**: Execute `SUPABASE_SETUP.sql` no SQL Editor

### "Acesso não autorizado"
- **Causa**: Email não está cadastrado na tabela `users`
- **Solução**: Adicione o email na tabela ou use um dos emails pré-cadastrados

### Erro de RLS (Row Level Security)
- **Causa**: Políticas de segurança bloqueando acesso
- **Solução**: Verifique se as políticas em `SUPABASE_SETUP.sql` foram criadas corretamente




