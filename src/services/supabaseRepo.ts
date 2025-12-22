import { supabase } from '../lib/supabase';
import {
  AttendanceRecord,
  Member,
  Meeting,
  User,
  UserProfile,
  UserStatus,
} from '../domain/types';

// Helpers ------------------------------------------------------------------
const handle = <T>(result: { data: T | null; error: any }) => {
  if (result.error) {
    throw result.error;
  }
  return result.data as T;
};

// Members ------------------------------------------------------------------
export async function fetchMembers(): Promise<Member[]> {
  const res = await supabase.from('members').select('*').order('name', { ascending: true });
  return handle(res).map((row: any) => ({
    id: row.id,
    name: row.name,
    evaluationRule: row.evaluation_rule,
  }));
}

export async function addMember(payload: { name: string; evaluationRule: Member['evaluationRule'] }) {
  const res = await supabase.from('members').insert({
    name: payload.name,
    evaluation_rule: payload.evaluationRule,
  });
  handle(res);
}

export async function updateMember(
  id: string,
  payload: { name?: string; evaluationRule?: Member['evaluationRule'] },
) {
  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.evaluationRule !== undefined) updateData.evaluation_rule = payload.evaluationRule;
  
  const res = await supabase.from('members').update(updateData).eq('id', id);
  handle(res);
}

export async function deleteMember(id: string) {
  const res = await supabase.from('members').delete().eq('id', id);
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

// Meetings -----------------------------------------------------------------
export async function fetchMeetings(): Promise<Meeting[]> {
  const res = await supabase.from('meetings').select('*').order('date', { ascending: true });
  return handle(res).map((row: any) => ({
    id: row.id,
    date: row.date,
    time: row.time ?? undefined,
    weekday: row.weekday,
    kind: row.kind,
  }));
}

export async function addMeeting(payload: {
  date: string;
  time?: string;
  weekday: Meeting['weekday'];
  kind: Meeting['kind'];
}) {
  const res = await supabase.from('meetings').insert({
    date: payload.date,
    time: payload.time ?? null,
    weekday: payload.weekday,
    kind: payload.kind,
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function updateMeeting(
  id: string,
  payload: {
    date?: string;
    time?: string;
    weekday?: Meeting['weekday'];
    kind?: Meeting['kind'];
  },
) {
  const updateData: any = {};
  if (payload.date !== undefined) updateData.date = payload.date;
  if (payload.time !== undefined) updateData.time = payload.time ?? null;
  if (payload.weekday !== undefined) updateData.weekday = payload.weekday;
  if (payload.kind !== undefined) updateData.kind = payload.kind;
  
  const res = await supabase.from('meetings').update(updateData).eq('id', id);
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export async function deleteMeeting(id: string) {
  const res = await supabase.from('meetings').delete().eq('id', id);
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

// Attendance ---------------------------------------------------------------
export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const res = await supabase.from('attendance_records').select('*');
  return handle(res).map((row: any) => ({
    id: row.id,
    memberId: row.member_id,
    meetingId: row.meeting_id,
    status: row.status,
    justificationText: row.justification_text ?? undefined,
  }));
}

export async function upsertAttendance(payload: {
  memberId: string;
  meetingId: string;
  status: AttendanceRecord['status'];
  justificationText?: string;
}) {
  const res = await supabase.from('attendance_records').upsert({
    member_id: payload.memberId,
    meeting_id: payload.meetingId,
    status: payload.status,
    justification_text: payload.justificationText ?? null,
  });
  handle(res);
}

// Users ------------------------------------------------------------------
export async function fetchUserByEmail(email: string): Promise<User | null> {
  try {
    const res = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'Ativo')
      .single();
    
    if (res.error) {
      if (res.error.code === 'PGRST116' || res.error.code === '42P01') {
        // No rows returned ou tabela não existe
        console.warn('Tabela users não encontrada ou email não cadastrado:', email);
        return null;
      }
      // Se for erro de tabela não existe, retornar null em vez de lançar erro
      if (res.error.message?.includes('does not exist') || res.error.message?.includes('não existe')) {
        console.warn('Tabela users não existe ainda. Criando estrutura...');
        return null;
      }
      throw res.error;
    }
    
    if (!res.data) return null;
    
    return {
      id: res.data.id,
      email: res.data.email,
      nome_completo: res.data.nome_completo,
      perfil: res.data.perfil,
      status: res.data.status,
      data_cadastro: res.data.data_cadastro,
      cadastrado_por: res.data.cadastrado_por ?? null,
    };
  } catch (error: any) {
    // Se houver qualquer erro (tabela não existe, etc), retornar null
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

export async function fetchUsers(): Promise<User[]> {
  const res = await supabase
    .from('users')
    .select('*')
    .order('data_cadastro', { ascending: false });
  
  return handle(res).map((row: any) => ({
    id: row.id,
    email: row.email,
    nome_completo: row.nome_completo,
    perfil: row.perfil,
    status: row.status,
    data_cadastro: row.data_cadastro,
    cadastrado_por: row.cadastrado_por ?? null,
  }));
}

export async function fetchOperators(): Promise<User[]> {
  const res = await supabase
    .from('users')
    .select('*')
    .eq('perfil', 'Operador')
    .order('data_cadastro', { ascending: false });
  
  return handle(res).map((row: any) => ({
    id: row.id,
    email: row.email,
    nome_completo: row.nome_completo,
    perfil: row.perfil,
    status: row.status,
    data_cadastro: row.data_cadastro,
    cadastrado_por: row.cadastrado_por ?? null,
  }));
}

export async function createUser(payload: {
  email: string;
  nome_completo: string;
  perfil: UserProfile;
  cadastrado_por: string;
}): Promise<User> {
  // Validar se é Gmail
  if (!payload.email.toLowerCase().endsWith('@gmail.com')) {
    throw new Error('Apenas emails Gmail são permitidos');
  }
  
  // Verificar se email já existe
  const existing = await fetchUserByEmail(payload.email);
  if (existing) {
    throw new Error('Este email já está cadastrado');
  }
  
  const res = await supabase.from('users').insert({
    email: payload.email.toLowerCase(),
    nome_completo: payload.nome_completo,
    perfil: payload.perfil,
    status: 'Ativo',
    cadastrado_por: payload.cadastrado_por,
  }).select().single();
  
  if (res.error) {
    throw res.error;
  }
  
  return {
    id: res.data.id,
    email: res.data.email,
    nome_completo: res.data.nome_completo,
    perfil: res.data.perfil,
    status: res.data.status,
    data_cadastro: res.data.data_cadastro,
    cadastrado_por: res.data.cadastrado_por ?? null,
  };
}

export async function updateUser(
  id: string,
  payload: {
    nome_completo?: string;
    status?: UserStatus;
  },
): Promise<User> {
  const updateData: any = {};
  if (payload.nome_completo !== undefined) updateData.nome_completo = payload.nome_completo;
  if (payload.status !== undefined) updateData.status = payload.status;
  
  const res = await supabase.from('users').update(updateData).eq('id', id).select().single();
  
  if (res.error) {
    throw res.error;
  }
  
  return {
    id: res.data.id,
    email: res.data.email,
    nome_completo: res.data.nome_completo,
    perfil: res.data.perfil,
    status: res.data.status,
    data_cadastro: res.data.data_cadastro,
    cadastrado_por: res.data.cadastrado_por ?? null,
  };
}
