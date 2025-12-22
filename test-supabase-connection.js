/**
 * Script para testar a conexão com Supabase e verificar políticas RLS
 * Execute: node test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lpwsggnkwbyyjcytuiwh.supabase.co';
const supabaseAnonKey = 'sb_publishable_fsGzRZs4YBuIAlX424CrTQ_oFUI549O';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');

  // Teste 1: Verificar se consegue acessar a tabela users (sem autenticação)
  console.log('1️⃣ Testando acesso à tabela users (como usuário anônimo)...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email, nome_completo, perfil, status')
      .limit(1);

    if (error) {
      console.error('❌ ERRO:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalhes:', error.details);
      
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
        console.error('\n🚨 PROBLEMA IDENTIFICADO: Políticas RLS bloqueando acesso!');
        console.error('📝 SOLUÇÃO: Execute o script VERIFICAR_E_CORRIGIR_POLITICAS.sql no Supabase SQL Editor');
        return false;
      }
      
      if (error.code === '42P01') {
        console.error('\n🚨 PROBLEMA IDENTIFICADO: Tabela users não existe!');
        console.error('📝 SOLUÇÃO: Execute o script SUPABASE_SETUP.sql no Supabase SQL Editor');
        return false;
      }
      
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ SUCESSO: Conseguiu acessar a tabela users!');
      console.log('   Usuários encontrados:', data.length);
      console.log('   Primeiro usuário:', data[0]);
      return true;
    } else {
      console.warn('⚠️ A tabela existe mas não há usuários cadastrados');
      console.warn('   Execute INSERT_USERS_ONLY.sql para adicionar usuários');
      return false;
    }
  } catch (err) {
    console.error('❌ ERRO INESPERADO:', err.message);
    return false;
  }
}

async function testSpecificEmail() {
  console.log('\n2️⃣ Testando busca por email específico (acaspiano@gmail.com)...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'acaspiano@gmail.com')
      .eq('status', 'Ativo')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('⚠️ Email não encontrado na tabela');
        console.warn('   Execute INSERT_USERS_ONLY.sql para adicionar o usuário');
        return false;
      }
      console.error('❌ ERRO:', error.message);
      return false;
    }

    if (data) {
      console.log('✅ Email encontrado!');
      console.log('   Email:', data.email);
      console.log('   Nome:', data.nome_completo);
      console.log('   Perfil:', data.perfil);
      return true;
    }

    return false;
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  DIAGNÓSTICO DE CONEXÃO SUPABASE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const connectionOk = await testConnection();
  await testSpecificEmail();

  console.log('\n═══════════════════════════════════════════════════════════════');
  if (connectionOk) {
    console.log('✅ TUDO OK: A conexão está funcionando corretamente!');
  } else {
    console.log('❌ PROBLEMA DETECTADO: Veja as instruções acima para resolver');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Acesse: https://supabase.com/dashboard');
    console.log('   2. Vá em SQL Editor > New Query');
    console.log('   3. Execute o script VERIFICAR_E_CORRIGIR_POLITICAS.sql');
    console.log('   4. Execute novamente este teste');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);

