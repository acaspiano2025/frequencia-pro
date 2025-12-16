export type MeetingKind = 'NORMAL' | 'OBRIGACAO' | 'DESENVOLVIMENTO';
export type WeekdayKind = '5A' | 'SAB' | 'DOM';

export interface Meeting {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  time?: string; // optional hh:mm
  weekday: WeekdayKind;
  kind: MeetingKind;
}

export interface Member {
  id: string;
  name: string;
  evaluationRule: 'AMBAS' | '5A' | 'SAB';
}

export type AttendanceStatus = 'OK' | 'FALTA_SEM' | 'FALTA_JUST';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  meetingId: string;
  status: AttendanceStatus;
  justificationText?: string;
}

export interface Denominadores {
  totalNormal: number;
  totalObrigacao: number;
  totalDesenvolvimento: number;
  totalTipos: number;
  total5a: number;
  totalDOM: number;
  totalSAB: number;
  totalDias: number;
}

export interface FrequenciaPorPessoa {
  memberId: string;
  presencasNormal: number;
  presencasObrigacao: number;
  presencasDesenvolvimento: number;
  presencas5a: number;
  presencasSab: number;
  presencasDom: number;
  faltasJust: number;
  faltasSem: number;
  freqNormal: number | null;
  freqObrigacao: number | null;
  freqDom: number | null;
  freq5a: number | null;
  freqSab: number | null;
  freqAmbas: number | null;
  percFaltasJust: number | null;
  percFaltasSem: number | null;
  totalFaltas: number;
}

