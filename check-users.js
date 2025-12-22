// Script para verificar usuários no Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lpwsggnkwbyyjcytuiwh.supabase.co';
const supabaseKey = 'sb_publishable_fsGzRZs4YBuIAlX424CrTQ_oFUI549O';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('🔍 Verificando usuários no banco de dados...\n');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email, nome_completo, perfil, status')
      .order('data_cadastro', { ascending: true });
    
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('❌ ERRO: A tabela "users" não existe!');
        console.log('\n📝 Ação necessária:');
        console.log('   1. Acesse o Supabase Dashboard');
        console.log('   2. Vá em SQL Editor');
        console.log('   3. Execute o arquivo SUPABASE_SETUP.sql\n');
        return;
      }
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado na tabela.\n');
      console.log('📝 Ação necessária:');
      console.log('   Execute o arquivo SUPABASE_SETUP.sql para criar os usuários pré-cadastrados.\n');
      return;
    }
    
    console.log(`✅ Encontrados ${data.length} usuário(s):\n`);
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ Email                        │ Nome          │ Perfil        │ Status │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    
    data.forEach(user => {
      const email = (user.email || '').padEnd(28);
      const nome = (user.nome_completo || '').padEnd(14);
      const perfil = (user.perfil || '').padEnd(13);
      const status = (user.status || '');
      console.log(`│ ${email} │ ${nome} │ ${perfil} │ ${status.padEnd(6)} │`);
    });
    
    console.log('└─────────────────────────────────────────────────────────────────┘\n');
    
    // Verificar se os usuários pré-cadastrados existem
    const requiredEmails = ['sbotelho79@gmail.com', 'acaspiano@gmail.com'];
    const foundEmails = data.map(u => u.email.toLowerCase());
    const missingEmails = requiredEmails.filter(email => !foundEmails.includes(email.toLowerCase()));
    
    if (missingEmails.length > 0) {
      console.log('⚠️  Usuários pré-cadastrados faltando:');
      missingEmails.forEach(email => console.log(`   - ${email}`));
      console.log('\n📝 Execute o SUPABASE_SETUP.sql para criar estes usuários.\n');
    } else {
      console.log('✅ Todos os usuários pré-cadastrados estão presentes!\n');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
    console.error('\nDetalhes:', error);
  }
}

checkUsers();

