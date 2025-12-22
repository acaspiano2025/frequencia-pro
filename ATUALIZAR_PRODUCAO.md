# 🚀 Como Atualizar o App em Produção

## 📋 Passo a Passo Completo

### 1️⃣ Verificar Alterações

No terminal, na pasta do projeto, execute:

```bash
cd "C:\Users\dnascimento.ASFCORP\Downloads\aplicativo Mobile\frequencia-pro"
git status
```

Isso mostra quais arquivos foram alterados.

---

### 2️⃣ Adicionar Alterações ao Git

```bash
git add .
```

Isso adiciona todas as alterações para serem commitadas.

---

### 3️⃣ Fazer Commit (Salvar Localmente)

```bash
git commit -m "Adicionar formato brasileiro de data e hora na aba Reuniões"
```

**Dica**: Use uma mensagem descritiva do que foi alterado.

---

### 4️⃣ Enviar para o GitHub

```bash
git push
```

Isso envia as alterações para o repositório no GitHub.

---

### 5️⃣ Fazer Build e Deploy no Vercel

```bash
npm run build:web
vercel --prod
```

Isso compila o app e faz deploy em produção.

---

## ⚡ Comandos Rápidos (Copie e Cole Tudo)

```bash
cd "C:\Users\dnascimento.ASFCORP\Downloads\aplicativo Mobile\frequencia-pro"
git add .
git commit -m "Adicionar formato brasileiro de data e hora na aba Reuniões"
git push
npm run build:web
vercel --prod
```

---

## 🔄 Para Próximas Atualizações

Sempre que fizer alterações, repita os passos acima:

1. `git add .` - Adiciona alterações
2. `git commit -m "Descrição"` - Salva localmente
3. `git push` - Envia para GitHub
4. `npm run build:web` - Compila
5. `vercel --prod` - Publica em produção

---

## ✅ Verificar se Funcionou

1. Aguarde o deploy terminar (aparece a URL no final)
2. Acesse: https://frequencia-pro.vercel.app
3. Recarregue com **Ctrl + Shift + R** (limpar cache)
4. Teste as novas funcionalidades!

---

## 🎯 Resumo

- **Git**: Salva no GitHub (histórico de versões)
- **Vercel**: Publica o app em produção (torna acessível online)

**Importante**: Sempre faça os dois (Git + Vercel) para manter tudo sincronizado!



