// Script para inserir usuários usando SQL direto via API do Supabase
// Este script tenta inserir os usuários desabilitando temporariamente o RLS

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lpwsggnkwbyyjcytuiwh.supabase.co';
// Usando a anon key - se não funcionar, você precisará usar a service_role key
const supabaseKey = 'sb_publishable_fsGzRZs4YBuIAlX424CrTQ_oFUI549O';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertUsersWithSQL() {
  console.log('📝 Tentando inserir usuários via SQL direto...\n');
  
  // SQL para inserir usuários (executado como administrador)
  const insertSQL = `
    INSERT INTO users (email, nome_completo, perfil, status, data_cadastro)
    VALUES 
      ('sbotelho79@gmail.com', 'Administrador', 'Administrador', 'Ativo', NOW()),
      ('acaspiano@gmail.com', 'Programador', 'Programador', 'Ativo', NOW())
    ON CONFLICT (email) DO UPDATE
    SET 
      nome_completo = EXCLUDED.nome_completo,
      perfil = EXCLUDED.perfil,
      status = EXCLUDED.status;
  `;
  
  try {
    // Tentar executar via RPC (se disponível)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: insertSQL });
    
    if (error) {
      console.log('⚠️  Não foi possível inserir via RPC. Isso é normal.');
      console.log('📝 Você precisa executar o SQL diretamente no Supabase Dashboard.\n');
      console.log('📋 SQL para copiar e colar no SQL Editor:\n');
      console.log('─'.repeat(70));
      console.log(insertSQL);
      console.log('─'.repeat(70));
      console.log('\n📝 Instruções:');
      console.log('   1. Acesse: https://supabase.com/dashboard');
      console.log('   2. Selecione seu projeto');
      console.log('   3. Vá em SQL Editor → New Query');
      console.log('   4. Cole o SQL acima');
      console.log('   5. Clique em Run (ou Ctrl+Enter)\n');
      return;
    }
    
    console.log('✅ Usuários inseridos com sucesso!\n');
    
  } catch (error) {
    console.log('⚠️  Não foi possível inserir via script.');
    console.log('📝 Execute o SQL diretamente no Supabase Dashboard.\n');
    console.log('📋 SQL para copiar:\n');
    console.log('─'.repeat(70));
    console.log(insertSQL);
    console.log('─'.repeat(70));
    console.log('\n📝 Passos:');
    console.log('   1. Supabase Dashboard → SQL Editor → New Query');
    console.log('   2. Cole o SQL acima');
    console.log('   3. Run (Ctrl+Enter)\n');
  }
}

insertUsersWithSQL();

