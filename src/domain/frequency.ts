import {
  AttendanceRecord,
  Denominadores,
  FrequenciaPorPessoa,
  Meeting,
  Member,
} from './types';

type Today = string | Date;

const isPastOrToday = (date: string, today: Today) =>
  new Date(date).getTime() <= new Date(today).getTime();

export function contagemMacro(meetings: Meeting[], today: Today): Denominadores {
  let totalNormal = 0;
  let totalObrigacao = 0;
  let totalDesenvolvimento = 0;
  let totalTipos = 0;
  let total5a = 0;
  let totalDOM = 0;
  let totalSAB = 0;
  let totalDias = 0;

  meetings.forEach((m) => {
    if (!isPastOrToday(m.date, today)) return;

    switch (m.kind) {
      case 'NORMAL':
        totalNormal += 1;
        break;
      case 'OBRIGACAO':
        totalObrigacao += 1;
        break;
      case 'DESENVOLVIMENTO':
        totalDesenvolvimento += 1;
        break;
      default:
        break;
    }

    switch (m.weekday) {
      case '5A':
        total5a += 1;
        break;
      case 'DOM':
        totalDOM += 1;
        break;
      case 'SAB':
        totalSAB += 1;
        break;
      default:
        break;
    }
  });

  totalTipos = totalNormal + totalObrigacao + totalDesenvolvimento;
  totalDias = total5a + totalDOM + totalSAB;

  return {
    totalNormal,
    totalObrigacao,
    totalDesenvolvimento,
    totalTipos,
    total5a,
    totalDOM,
    totalSAB,
    totalDias,
  };
}

function denominadorAgendado(meetings: Meeting[], kind: Meeting['kind'] | 'DOM'): number {
  if (kind === 'DOM') {
    // DOM: por dia da semana, agendado para o ano inteiro.
    return meetings.filter((m) => m.weekday === 'DOM').length;
  }
  // NORMAL / OBRIGACAO: agendado para o ano inteiro.
  return meetings.filter((m) => m.kind === kind).length;
}

export function atualizarFrequenciaPorPessoa(
  members: Member[],
  meetings: Meeting[],
  attendance: AttendanceRecord[],
  today: Today,
): FrequenciaPorPessoa[] {
  const denomRealizados = contagemMacro(meetings, today);

  // Index helpers
  const attendanceByMeeting = attendance.reduce<Record<string, AttendanceRecord[]>>((acc, rec) => {
    acc[rec.meetingId] = acc[rec.meetingId] || [];
    acc[rec.meetingId].push(rec);
    return acc;
  }, {});

  return members.map((member) => {
    let presencasNormal = 0;
    let presencasObrigacao = 0;
    let presencasDesenvolvimento = 0;
    let presencas5a = 0;
    let presencasSab = 0;
    let presencasDom = 0;
    let faltasJust = 0;
    let faltasSem = 0;

    meetings.forEach((meeting) => {
      if (!isPastOrToday(meeting.date, today)) return;

      const rec = (attendanceByMeeting[meeting.id] || []).find(
        (r) => r.memberId === member.id,
      );

      const status = rec?.status;
      if (status === 'OK') {
        if (meeting.kind === 'NORMAL') presencasNormal += 1;
        if (meeting.kind === 'OBRIGACAO') presencasObrigacao += 1;
        if (meeting.kind === 'DESENVOLVIMENTO') presencasDesenvolvimento += 1;

        if (meeting.weekday === '5A') presencas5a += 1;
        if (meeting.weekday === 'SAB') presencasSab += 1;
        if (meeting.weekday === 'DOM') presencasDom += 1;
      } else if (status === 'FALTA_JUST') {
        faltasJust += 1;
      } else {
        // vazio / não encontrado / FALTA_SEM -> falta sem justificativa
        faltasSem += 1;
      }
    });

    // Denominadores inconsistentes (agendado para o ano todo)
    const denomNormalAgendado = denominadorAgendado(meetings, 'NORMAL');
    const denomObrigAgendado = denominadorAgendado(meetings, 'OBRIGACAO');
    const denomDomAgendado = denominadorAgendado(meetings, 'DOM');

    // Frequências
    const freqNormal =
      denomNormalAgendado > 0 ? presencasNormal / denomNormalAgendado : null;
    const freqObrigacao =
      denomObrigAgendado > 0 ? presencasObrigacao / denomObrigAgendado : null;
    const freqDom = denomDomAgendado > 0 ? presencasDom / denomDomAgendado : null;

    const freq5a = denomRealizados.total5a > 0 ? presencas5a / denomRealizados.total5a : null;
    const freqSab = denomRealizados.totalSAB > 0 ? presencasSab / denomRealizados.totalSAB : null;

    const totalAmbasDenom = denomRealizados.total5a + denomRealizados.totalSAB;
    const freqAmbas =
      totalAmbasDenom > 0 ? (presencas5a + presencasSab) / totalAmbasDenom : null;

    const percFaltasJust =
      denomRealizados.totalDias > 0 ? faltasJust / denomRealizados.totalDias : null;
    const percFaltasSem =
      denomRealizados.totalDias > 0 ? faltasSem / denomRealizados.totalDias : null;

    const totalFaltas = faltasJust + faltasSem;

    // Regra condicional por membro (AMBAS vs 5A/SAB)
    const showAmbas = member.evaluationRule === 'AMBAS';

    return {
      memberId: member.id,
      presencasNormal,
      presencasObrigacao,
      presencasDesenvolvimento,
      presencas5a,
      presencasSab,
      presencasDom,
      faltasJust,
      faltasSem,
      freqNormal,
      freqObrigacao,
      freqDom,
      freq5a: showAmbas ? null : freq5a,
      freqSab: showAmbas ? null : freqSab,
      freqAmbas: showAmbas ? freqAmbas : null,
      percFaltasJust,
      percFaltasSem,
      totalFaltas,
    };
  });
}

