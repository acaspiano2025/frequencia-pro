// Script para inserir usuários pré-cadastrados no Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lpwsggnkwbyyjcytuiwh.supabase.co';
const supabaseKey = 'sb_publishable_fsGzRZs4YBuIAlX424CrTQ_oFUI549O';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertUsers() {
  console.log('📝 Inserindo usuários pré-cadastrados...\n');
  
  const users = [
    {
      email: 'sbotelho79@gmail.com',
      nome_completo: 'Administrador',
      perfil: 'Administrador',
      status: 'Ativo'
    },
    {
      email: 'acaspiano@gmail.com',
      nome_completo: 'Programador',
      perfil: 'Programador',
      status: 'Ativo'
    }
  ];
  
  try {
    for (const user of users) {
      const { data, error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'email' });
      
      if (error) {
        console.error(`❌ Erro ao inserir ${user.email}:`, error.message);
      } else {
        console.log(`✅ ${user.email} - ${user.perfil} inserido/atualizado`);
      }
    }
    
    console.log('\n🔍 Verificando usuários inseridos...\n');
    
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('email, nome_completo, perfil, status')
      .order('data_cadastro', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar usuários:', fetchError.message);
      return;
    }
    
    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado após inserção.\n');
      return;
    }
    
    console.log(`✅ Total de ${allUsers.length} usuário(s) cadastrado(s):\n`);
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ Email                        │ Nome          │ Perfil        │ Status │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    
    allUsers.forEach(user => {
      const email = (user.email || '').padEnd(28);
      const nome = (user.nome_completo || '').padEnd(14);
      const perfil = (user.perfil || '').padEnd(13);
      const status = (user.status || '');
      console.log(`│ ${email} │ ${nome} │ ${perfil} │ ${status.padEnd(6)} │`);
    });
    
    console.log('└─────────────────────────────────────────────────────────────────┘\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('\nDetalhes:', error);
  }
}

insertUsers();

