# 📋 Como Executar o SUPABASE_SETUP.sql

## 🎯 Passo a Passo Completo

### 1. Acesse o Supabase Dashboard
- Abra seu navegador
- Acesse: **https://supabase.com/dashboard**
- Faça login na sua conta
- Selecione o projeto: **lpwsggnkwbyyjcytuiwh**

### 2. Abra o SQL Editor
- No menu lateral esquerdo, clique em **"SQL Editor"**
- Clique no botão **"New Query"** (ou use o ícone +)

### 3. Copie o Conteúdo do Arquivo
- Abra o arquivo `SUPABASE_SETUP.sql` no seu editor
- Selecione **TODO o conteúdo** (Ctrl+A)
- Copie (Ctrl+C)

### 4. Cole no SQL Editor do Supabase
- Cole o conteúdo no campo de texto do SQL Editor (Ctrl+V)
- Verifique se todo o código foi colado corretamente

### 5. Execute o Script
- Clique no botão **"Run"** (ou pressione **Ctrl+Enter**)
- Aguarde alguns segundos

### 6. Verifique o Resultado
- Você deve ver uma mensagem de sucesso
- No final do script, deve aparecer uma tabela com os 2 usuários:
  - `sbotelho79@gmail.com` (Administrador)
  - `acaspiano@gmail.com` (Programador)

### 7. Verifique Localmente
Após executar no Supabase, volte ao terminal e execute:
```bash
node check-users.js
```

## ✅ O que o Script Faz

1. ✅ Cria a tabela `users` (se não existir)
2. ✅ Cria índices para melhor performance
3. ✅ Configura Row Level Security (RLS)
4. ✅ Cria políticas de segurança
5. ✅ Insere os 2 usuários pré-cadastrados

## ⚠️ Se Der Erro

- **Erro de permissão**: Verifique se está logado no Supabase
- **Erro de sintaxe**: Certifique-se de copiar TODO o arquivo
- **Tabela já existe**: Não tem problema, o script usa `IF NOT EXISTS`

## 🎉 Próximos Passos

Após executar com sucesso:
1. Execute `node check-users.js` para verificar
2. Configure as URLs de callback no Supabase (Authentication → URL Configuration)
3. Teste o login no aplicativo!




