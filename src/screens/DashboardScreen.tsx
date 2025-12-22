import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { atualizarFrequenciaPorPessoa, contagemMacro } from '../domain/frequency';
import { fetchAttendance, fetchMeetings, fetchMembers } from '../services/supabaseRepo';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

export default function DashboardScreen() {
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [totalMeetingsRealized, setTotalMeetingsRealized] = useState(0);
  const [averageFrequency, setAverageFrequency] = useState<number | null>(null);
  const [nextMeeting, setNextMeeting] = useState<{
    date: string;
    weekday: string;
    kind: string;
    time?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [meetings, members, attendance] = await Promise.all([
          fetchMeetings(),
          fetchMembers(),
          fetchAttendance(),
        ]);

        const today = new Date();
        setTotalMeetings(meetings.length);

        // Total de reuniões realizadas (até hoje)
        const denom = contagemMacro(meetings, today);
        setTotalMeetingsRealized(denom.totalDias);

        // Calcular média de frequência geral
        if (members.length > 0 && meetings.length > 0) {
          const frequencias = atualizarFrequenciaPorPessoa(members, meetings, attendance, today);
          const frequenciasValidas = frequencias
            .map((f) => {
              // Usar AMBAS se disponível, senão usar 5A ou SAB
              return f.freqAmbas ?? f.freq5a ?? f.freqSab ?? null;
            })
            .filter((f): f is number => f !== null);

          if (frequenciasValidas.length > 0) {
            const soma = frequenciasValidas.reduce((acc, f) => acc + f, 0);
            setAverageFrequency(soma / frequenciasValidas.length);
          } else {
            setAverageFrequency(null);
          }
        }

        // Próxima reunião agendada
        const upcoming = meetings
          .filter((m) => new Date(m.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        if (upcoming) {
          setNextMeeting({
            date: upcoming.date,
            weekday: upcoming.weekday,
            kind: upcoming.kind,
            time: upcoming.time,
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatPercentage = (value: number | null) => {
    if (value === null) return '—';
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Dashboard</Text>
      <Text style={commonStyles.caption}>Visão geral do sistema de frequência</Text>

      <View style={styles.cards}>
        {/* Total de Reuniões Realizadas */}
        <View style={[commonStyles.card, styles.statCard]}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>📅</Text>
          </View>
          <Text style={styles.statValue}>{totalMeetingsRealized}</Text>
          <Text style={styles.statLabel}>Reuniões Realizadas</Text>
          <Text style={styles.statSubLabel}>
            {totalMeetings} reuniões cadastradas no total
          </Text>
        </View>

        {/* Média de Frequência Geral */}
        <View style={[commonStyles.card, styles.statCard, styles.frequencyCard]}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>📊</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {formatPercentage(averageFrequency)}
          </Text>
          <Text style={styles.statLabel}>Média de Frequência Geral</Text>
          <Text style={styles.statSubLabel}>
            Média de presença de todos os membros
          </Text>
        </View>

        {/* Próxima Reunião Agendada */}
        {nextMeeting && (
          <View style={[commonStyles.card, styles.nextMeetingCard]}>
            <View style={styles.nextMeetingHeader}>
              <Text style={styles.nextMeetingIcon}>⏰</Text>
              <Text style={styles.nextMeetingLabel}>Próxima Reunião Agendada</Text>
            </View>
            <View style={styles.nextMeetingContent}>
              <Text style={styles.nextMeetingDate}>
                {nextMeeting.time 
                  ? `📅 ${nextMeeting.date} às ${nextMeeting.time}`
                  : `📅 ${nextMeeting.date}`}
              </Text>
              <View style={styles.nextMeetingBadges}>
                <View style={[commonStyles.badge, commonStyles.badgeSuccess]}>
                  <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>
                    {nextMeeting.weekday}
                  </Text>
                </View>
                <View style={[commonStyles.badge, commonStyles.badgeWarning]}>
                  <Text style={[commonStyles.badgeText, commonStyles.badgeTextWarning]}>
                    {nextMeeting.kind}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Card Informativo */}
        <View style={[commonStyles.card, styles.infoCard]}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Use as abas abaixo para gerenciar reuniões, registrar frequência e visualizar relatórios detalhados com todos os cálculos de frequência.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: 16,
  },
  statCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary + '20',
  },
  frequencyCard: {
    backgroundColor: colors.success + '08',
    borderColor: colors.success + '20',
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statIcon: {
    fontSize: 32,
  },
  statValue: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: -2,
  },
  statLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  nextMeetingCard: {
    padding: 24,
    backgroundColor: colors.warning + '08',
    borderColor: colors.warning + '20',
  },
  nextMeetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  nextMeetingIcon: {
    fontSize: 24,
  },
  nextMeetingLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextMeetingContent: {
    gap: 12,
  },
  nextMeetingDate: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  nextMeetingBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: colors.surfaceElevated,
    gap: 16,
  },
  infoIcon: {
    fontSize: 28,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
