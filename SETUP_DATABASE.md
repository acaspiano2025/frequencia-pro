# Configuração do Banco de Dados Supabase

## Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script SQL**
   - Abra o arquivo `supabase-schema.sql` neste projeto
   - Copie todo o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" (ou pressione Ctrl+Enter)

4. **Verificar as Tabelas**
   - No menu lateral, clique em "Table Editor"
   - Você deve ver 3 tabelas criadas:
     - `members` (Membros)
     - `meetings` (Reuniões)
     - `attendance_records` (Registros de Frequência)

5. **Pronto!**
   - O banco de dados está configurado
   - As políticas de segurança (RLS) estão ativadas
   - Apenas usuários autenticados podem acessar os dados

## Estrutura das Tabelas

### `members`
- `id` (UUID): Identificador único
- `name` (TEXT): Nome do membro
- `evaluation_rule` (TEXT): Regra de avaliação ('AMBAS', '5A', 'SAB')
- `created_at`, `updated_at`: Timestamps automáticos

### `meetings`
- `id` (UUID): Identificador único
- `date` (DATE): Data da reunião
- `time` (TIME): Hora da reunião (opcional)
- `weekday` (TEXT): Dia da semana ('5A', 'SAB', 'DOM')
- `kind` (TEXT): Tipo de reunião ('NORMAL', 'OBRIGACAO', 'DESENVOLVIMENTO')
- `created_at`, `updated_at`: Timestamps automáticos

### `attendance_records`
- `id` (UUID): Identificador único
- `member_id` (UUID): Referência ao membro
- `meeting_id` (UUID): Referência à reunião
- `status` (TEXT): Status da presença ('OK', 'FALTA_SEM', 'FALTA_JUST')
- `justification_text` (TEXT): Texto de justificativa (opcional)
- `created_at`, `updated_at`: Timestamps automáticos
- **Constraint**: Um membro só pode ter um registro por reunião (UNIQUE)

## Notas Importantes

- As políticas RLS (Row Level Security) garantem que apenas usuários autenticados possam acessar os dados
- Os timestamps `updated_at` são atualizados automaticamente quando um registro é modificado
- As foreign keys garantem integridade referencial (ex: não é possível excluir um membro que tem registros de frequência sem antes excluir os registros)

