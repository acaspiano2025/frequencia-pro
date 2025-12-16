# 📦 Guia: Salvar Código no GitHub e Atualizar Deploy

## ⚠️ Situação Atual

As alterações que fizemos estão **apenas no seu computador local**. Elas **NÃO estão** no GitHub ainda.

O app em produção (https://frequencia-pro.vercel.app) está rodando uma versão **anterior** do código.

---

## 🎯 Opção 1: Salvar no GitHub (Recomendado)

### Passo 1: Instalar Git (se ainda não tiver)

1. Baixe o Git: https://git-scm.com/download/win
2. Instale seguindo o assistente
3. Reinicie o terminal após instalar

### Passo 2: Criar Repositório no GitHub

1. Acesse: https://github.com
2. Faça login (ou crie conta)
3. Clique em **"New repository"** (ou **"+"** → **"New repository"**)
4. Preencha:
   - **Repository name**: `frequencia-pro`
   - **Description**: "Aplicativo mobile de controle de frequência"
   - **Public** ou **Private** (escolha)
   - **NÃO marque** "Initialize with README"
5. Clique em **"Create repository"**
6. **Copie a URL** do repositório (ex: `https://github.com/seu-usuario/frequencia-pro.git`)

### Passo 3: Configurar Git no Projeto

Abra o terminal na pasta do projeto e execute:

```bash
# Navegar para a pasta do projeto
cd "C:\Users\dnascimento.ASFCORP\Downloads\aplicativo Mobile\frequencia-pro"

# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Versão inicial do Frequência Pro com todas as funcionalidades"

# Adicionar repositório remoto (substitua pela URL do seu repositório)
git remote add origin https://github.com/SEU-USUARIO/frequencia-pro.git

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

### Passo 4: Conectar Vercel ao GitHub

1. Acesse: https://vercel.com/dashboard
2. Vá no projeto **frequencia-pro**
3. Vá em **Settings** → **Git**
4. Clique em **"Connect Git Repository"**
5. Selecione seu repositório do GitHub
6. O Vercel fará deploy automático sempre que você fizer push!

---

## 🚀 Opção 2: Deploy Manual no Vercel (Mais Rápido)

Se você só quer atualizar o app em produção **sem usar GitHub**:

### Passo 1: Fazer Build Local

```bash
cd "C:\Users\dnascimento.ASFCORP\Downloads\aplicativo Mobile\frequencia-pro"
npm run build:web
```

### Passo 2: Deploy no Vercel

```bash
# Se ainda não fez login
vercel login

# Deploy em produção
vercel --prod
```

Isso vai fazer upload do código atual e atualizar o app em produção.

---

## 📝 Opção 3: Atualizar Código no GitHub (Se já tiver repositório)

Se você **já tem** um repositório no GitHub:

```bash
cd "C:\Users\dnascimento.ASFCORP\Downloads\aplicativo Mobile\frequencia-pro"

# Verificar status
git status

# Adicionar alterações
git add .

# Fazer commit
git commit -m "Adicionar campo de pesquisa e botões de ação na aba Membros"

# Enviar para GitHub
git push
```

Se o Vercel estiver conectado ao GitHub, o deploy será automático!

---

## ✅ Verificar se Funcionou

1. Acesse: https://frequencia-pro.vercel.app
2. Recarregue a página com **Ctrl + Shift + R** (limpar cache)
3. Vá na aba **"Membros"**
4. Você deve ver:
   - ✅ Campo de pesquisa acima da lista
   - ✅ Botões "Alterar" e "Excluir" em cada membro
   - ✅ Contagem correta de membros
   - ✅ Título "Novo Membro" (sem ";")

---

## 🔄 Próximas Atualizações

Depois de configurar o GitHub:

1. **Fazer alterações** no código
2. **Commitar**:
   ```bash
   git add .
   git commit -m "Descrição da alteração"
   git push
   ```
3. **Vercel faz deploy automático** (se conectado ao GitHub)

---

## ❓ Dúvidas?

- **Git não instalado?** → Use a Opção 2 (Deploy Manual)
- **Já tem GitHub?** → Use a Opção 3
- **Quer automatizar?** → Use a Opção 1 (conecta GitHub + Vercel)

---

**Importante**: As alterações que fizemos (campo de pesquisa, botões de ação) estão **salvas no seu computador**, mas precisam ser enviadas para o GitHub e/ou fazer novo deploy no Vercel para aparecerem no app online.

