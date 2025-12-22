# 📘 Guia Passo a Passo - Configuração e Uso do Frequência Pro

## 🗄️ PARTE 1: Configurar o Banco de Dados no Supabase

### Passo 1: Acessar o Supabase Dashboard
1. Abra seu navegador e acesse: **https://supabase.com/dashboard**
2. Faça login com sua conta (a mesma que você usou para criar o projeto)
3. Selecione o projeto **Frequência Pro** (ou o projeto que você criou)

### Passo 2: Abrir o SQL Editor
1. No menu lateral esquerdo, procure por **"SQL Editor"** (ícone de código `</>`)
2. Clique em **"SQL Editor"**
3. Clique no botão **"New query"** (Nova consulta) no canto superior direito

### Passo 3: Copiar o Script SQL
1. No seu computador, abra o arquivo: **`supabase-schema.sql`**
   - Localização: `frequencia-pro/supabase-schema.sql`
2. Selecione **TODO o conteúdo** do arquivo (Ctrl+A)
3. Copie o conteúdo (Ctrl+C)

### Passo 4: Colar e Executar no Supabase
1. No SQL Editor do Supabase, cole o script copiado (Ctrl+V)
2. Verifique se o script foi colado completamente
3. Clique no botão **"Run"** (ou pressione **Ctrl+Enter**)
4. Aguarde alguns segundos...

### Passo 5: Verificar se Funcionou
1. Você deve ver uma mensagem de sucesso: **"Success. No rows returned"**
2. No menu lateral, clique em **"Table Editor"** (Editor de Tabelas)
3. Você deve ver **3 tabelas criadas**:
   - ✅ `members` (Membros)
   - ✅ `meetings` (Reuniões)
   - ✅ `attendance_records` (Registros de Frequência)

**🎉 Pronto! O banco de dados está configurado!**

---

## 🧪 PARTE 2: Testar as Funcionalidades

### Opção A: Testar no Navegador (Web)
1. Abra o navegador e acesse: **http://localhost:8084** (ou a porta que estiver rodando)
2. Ou acesse a versão em produção: **https://frequencia-pro.vercel.app**

### Opção B: Testar no Aplicativo (se estiver rodando)
1. Execute o comando no terminal:
   ```bash
   cd "C:\Users\dnascimento.ASFCORP\Downloads\aplicativo Mobile\frequencia-pro"
   npm start
   ```

---

## 👥 TESTE 1: Cadastrar Membros

### Passo a Passo:
1. **Faça login** no aplicativo (email/senha ou Google)
2. Clique na aba **"Membros"** (ícone de pessoas)
3. No formulário "Novo Membro":
   - Digite o **nome** do membro (ex: "João Silva")
   - Selecione a **Regra de Avaliação**:
     - **AMBAS**: Avalia 5ª e Sábado juntos
     - **5A**: Avalia apenas 5ª feira
     - **SAB**: Avalia apenas Sábado
4. Clique em **"➕ Adicionar Membro"**
5. Você verá o membro aparecer na lista abaixo

**💡 Dica**: Cadastre pelo menos 3-4 membros para testar melhor.

---

## 📅 TESTE 2: Agendar Reuniões

### Passo a Passo:
1. Clique na aba **"Reuniões"** (ícone de calendário)
2. No formulário "Nova Reunião":
   - **Data**: Digite no formato `yyyy-mm-dd` (ex: `2025-01-15`)
     - O sistema detectará automaticamente o dia da semana!
   - **Hora**: Digite no formato `hh:mm` (ex: `14:30`) - *opcional*
   - **Dia da Semana**: Será detectado automaticamente, mas você pode alterar
     - Escolha: **5A**, **SAB** ou **DOM**
   - **Tipo de Reunião**: Escolha:
     - **NORMAL**: Reunião normal
     - **OBRIGAÇÃO**: Reunião obrigatória
     - **DESENVOLVIMENTO**: Reunião de desenvolvimento
3. Clique em **"➕ Adicionar Reunião"**
4. A reunião aparecerá na lista abaixo

**💡 Dica**: 
- Cadastre algumas reuniões passadas (ex: `2025-01-10`) e algumas futuras (ex: `2025-02-20`)
- Use datas de 5ª feira, Sábado ou Domingo para testar os diferentes tipos

---

## ✅ TESTE 3: Registrar Frequência

### Passo a Passo:
1. Clique na aba **"Frequência"** (ícone de checklist)
2. **Selecione uma reunião** na lista horizontal no topo
   - Escolha uma reunião que já passou (data anterior a hoje)
3. Para cada membro, você verá 3 botões:
   - **✅ OK**: Marca presença
   - **❌ Falta**: Marca falta sem justificativa
   - **⚠️ Justificada**: Marca falta com justificativa
4. **Para marcar presença**:
   - Clique em **"✅ OK"**
   - O status mudará para "OK" (verde)
5. **Para marcar falta sem justificativa**:
   - Clique em **"❌ Falta"**
   - O status mudará para "FALTA_SEM" (vermelho)
6. **Para marcar falta com justificativa**:
   - Clique em **"⚠️ Justificada"**
   - Um campo de texto aparecerá
   - Digite a justificativa (ex: "Atestado médico")
   - Clique em **"Confirmar"**
   - O status mudará para "FALTA_JUST" (amarelo)

**💡 Dica**: 
- Marque alguns membros como presentes (OK)
- Marque alguns como faltas (com e sem justificativa)
- Isso será usado nos relatórios!

---

## 📊 TESTE 4: Visualizar Relatórios

### Passo a Passo:
1. Clique na aba **"Relatórios"** (ícone de gráfico)
2. Você verá:
   - **Totais de Reuniões Realizadas**: Cards com os totais calculados
   - **Relatório por Membro**: Para cada membro cadastrado:
     - **Frequências por Tipo**: NORMAL, OBRIGAÇÃO, DOM (com inconsistência replicada)
     - **Frequências por Dia**: 5ª, SAB ou AMBAS (conforme regra do membro)
     - **Análise de Faltas**: Percentuais e totais
     - **Detalhamento**: Números absolutos de presenças e faltas

3. **Interpretação das Cores**:
   - 🟢 **Verde**: Frequência ≥ 90% (excelente)
   - 🟡 **Amarelo**: Frequência ≥ 70% (bom)
   - 🔴 **Vermelho**: Frequência < 70% (atenção)

**💡 Dica**: 
- Compare os relatórios de membros com regras diferentes (AMBAS vs 5A/SAB)
- Verifique se os cálculos estão corretos conforme a lógica da planilha

---

## 🏠 TESTE 5: Verificar o Dashboard

### Passo a Passo:
1. Clique na aba **"Dashboard"** (ícone de casa)
2. Você verá:
   - **Total de Reuniões Realizadas**: Número de reuniões que já passaram
   - **Média de Frequência Geral**: Média de todos os membros
   - **Próxima Reunião Agendada**: Widget com a próxima reunião futura

**💡 Dica**: 
- O dashboard atualiza automaticamente conforme você cadastra reuniões e registra frequências

---

## 🌐 PARTE 3: Acessar a Versão em Produção

### Acessar o App Publicamente:
1. Abra o navegador
2. Acesse: **https://frequencia-pro.vercel.app**
3. Faça login com suas credenciais
4. O app funciona exatamente igual à versão local!

**⚠️ Importante**: 
- Certifique-se de que as configurações de OAuth (Google) estão atualizadas no Supabase e Google Cloud Console para funcionar na versão web

---

## 🔧 Resolução de Problemas

### Problema: "Erro ao carregar dados"
**Solução**: 
- Verifique se executou o script SQL no Supabase
- Verifique se está logado no aplicativo
- Verifique a conexão com a internet

### Problema: "Nenhuma reunião cadastrada"
**Solução**: 
- Vá na aba "Reuniões" e cadastre pelo menos uma reunião

### Problema: "Nenhum membro cadastrado"
**Solução**: 
- Vá na aba "Membros" e cadastre pelo menos um membro

### Problema: Relatórios vazios
**Solução**: 
- Certifique-se de ter:
  1. Membros cadastrados
  2. Reuniões cadastradas (algumas passadas)
  3. Frequências registradas para essas reuniões

---

## ✅ Checklist Final

Antes de considerar tudo configurado, verifique:

- [ ] Script SQL executado no Supabase
- [ ] 3 tabelas criadas (members, meetings, attendance_records)
- [ ] Pelo menos 3 membros cadastrados
- [ ] Pelo menos 5 reuniões cadastradas (algumas passadas, algumas futuras)
- [ ] Frequências registradas para pelo menos 2 reuniões passadas
- [ ] Dashboard mostrando dados
- [ ] Relatórios calculando corretamente
- [ ] App funcionando na versão web (Vercel)

---

## 🎉 Pronto!

Se todos os testes passaram, seu aplicativo está **100% funcional** e pronto para uso!

**Dúvidas?** Consulte os arquivos:
- `SETUP_DATABASE.md` - Detalhes técnicos do banco
- `FUNCIONALIDADES.md` - Lista completa de funcionalidades



