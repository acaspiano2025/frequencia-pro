import { supabase } from '../lib/supabase';
import {
  AttendanceRecord,
  Member,
  Meeting,
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
  handle(res);
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
  handle(res);
}

export async function deleteMeeting(id: string) {
  const res = await supabase.from('meetings').delete().eq('id', id);
  handle(res);
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
