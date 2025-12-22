/**
 * Script para listar todos os dados das tabelas do Supabase
 * Execute: node listar-dados-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lpwsggnkwbyyjcytuiwh.supabase.co';
const supabaseAnonKey = 'sb_publishable_fsGzRZs4YBuIAlX424CrTQ_oFUI549O';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listarUsuarios() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  👥 USUÁRIOS CADASTRADOS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('data_cadastro', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar usuários:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum usuário cadastrado');
    return;
  }

  console.log(`\nTotal de usuários: ${data.length}\n`);
  
  data.forEach((user, index) => {
    console.log(`${index + 1}. ${user.nome_completo}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Perfil: ${user.perfil}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Data de Cadastro: ${new Date(user.data_cadastro).toLocaleString('pt-BR')}`);
    if (user.cadastrado_por) {
      console.log(`   Cadastrado por: ${user.cadastrado_por}`);
    }
    console.log('');
  });
}

async function listarMembros() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  👤 MEMBROS CADASTRADOS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar membros:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum membro cadastrado');
    return;
  }

  console.log(`\nTotal de membros: ${data.length}\n`);
  
  data.forEach((member, index) => {
    console.log(`${index + 1}. ${member.name}`);
    console.log(`   ID: ${member.id}`);
    console.log(`   Regra de Avaliação: ${member.evaluation_rule}`);
    console.log('');
  });
}

async function listarReunioes() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📅 REUNIÕES CADASTRADAS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar reuniões:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhuma reunião cadastrada');
    return;
  }

  console.log(`\nTotal de reuniões: ${data.length}\n`);
  
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  data.forEach((meeting, index) => {
    const dataReuniao = new Date(meeting.date);
    const dataFormatada = dataReuniao.toLocaleDateString('pt-BR');
    const horaFormatada = meeting.time ? new Date(`2000-01-01T${meeting.time}`).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem hora';
    
    console.log(`${index + 1}. ${dataFormatada} (${diasSemana[meeting.weekday]}) - ${meeting.kind}`);
    console.log(`   ID: ${meeting.id}`);
    console.log(`   Hora: ${horaFormatada}`);
    console.log(`   Data completa: ${meeting.date}`);
    console.log('');
  });
}

async function listarFrequencias() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ REGISTROS DE FREQUÊNCIA');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      members(name),
      meetings(date, kind)
    `)
    .order('meetings(date)', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar frequências:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum registro de frequência');
    return;
  }

  console.log(`\nTotal de registros: ${data.length}\n`);
  
  data.forEach((record, index) => {
    const meeting = record.meetings;
    const member = record.members;
    const dataReuniao = meeting ? new Date(meeting.date).toLocaleDateString('pt-BR') : 'N/A';
    
    console.log(`${index + 1}. ${member?.name || 'Membro não encontrado'}`);
    console.log(`   Reunião: ${dataReuniao} (${meeting?.kind || 'N/A'})`);
    console.log(`   Status: ${record.status}`);
    if (record.justification_text) {
      console.log(`   Justificativa: ${record.justification_text}`);
    }
    console.log('');
  });
}

async function resumoEstatisticas() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 RESUMO ESTATÍSTICO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Contar usuários
  const { data: users } = await supabase.from('users').select('id', { count: 'exact' });
  const { data: members } = await supabase.from('members').select('id', { count: 'exact' });
  const { data: meetings } = await supabase.from('meetings').select('id', { count: 'exact' });
  const { data: attendance } = await supabase.from('attendance_records').select('id', { count: 'exact' });

  console.log(`👥 Usuários: ${users?.length || 0}`);
  console.log(`👤 Membros: ${members?.length || 0}`);
  console.log(`📅 Reuniões: ${meetings?.length || 0}`);
  console.log(`✅ Registros de Frequência: ${attendance?.length || 0}`);
  
  // Estatísticas de frequência
  if (attendance && attendance.length > 0) {
    const { data: freqData } = await supabase
      .from('attendance_records')
      .select('status');
    
    const stats = {
      'Presente': 0,
      'Falta': 0,
      'Justificada': 0
    };
    
    freqData?.forEach(r => {
      if (r.status === 'PRESENT') stats['Presente']++;
      else if (r.status === 'ABSENT') stats['Falta']++;
      else if (r.status === 'JUSTIFIED') stats['Justificada']++;
    });
    
    console.log('\n📈 Distribuição de Frequência:');
    console.log(`   Presentes: ${stats['Presente']}`);
    console.log(`   Faltas: ${stats['Falta']}`);
    console.log(`   Justificadas: ${stats['Justificada']}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📋 RELATÓRIO COMPLETO DO BANCO DE DADOS');
  console.log('  Frequência Pro - Supabase');
  console.log('═══════════════════════════════════════════════════════════════');

  await listarUsuarios();
  await listarMembros();
  await listarReunioes();
  await listarFrequencias();
  await resumoEstatisticas();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ Relatório concluído!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);

