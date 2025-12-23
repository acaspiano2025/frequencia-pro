import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { atualizarFrequenciaPorPessoa, contagemMacro } from '../domain/frequency';
import { AttendanceRecord, Meeting, Member } from '../domain/types';
import { fetchAttendance, fetchMeetings, fetchMembers } from '../services/supabaseRepo';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

export default function ReportsScreen() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [denominadores, setDenominadores] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [m, mem, att] = await Promise.all([
        fetchMeetings(),
        fetchMembers(),
        fetchAttendance(),
      ]);
      setMeetings(m);
      setMembers(mem);
      setAttendance(att);
      
      // Calcular denominadores (totais)
      const today = new Date();
      const denom = contagemMacro(m, today);
      setDenominadores(denom);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const data = useMemo(() => {
    if (!meetings.length || !members.length) return [];
    return atualizarFrequenciaPorPessoa(members, meetings, attendance, new Date());
  }, [meetings, members, attendance]);

  const pct = (value: number | null) =>
    value === null ? '—' : `${(value * 100).toFixed(1)}%`;

  const getPercentageColor = (value: number | null) => {
    if (value === null) return colors.textTertiary;
    if (value >= 0.9) return colors.success;
    if (value >= 0.7) return colors.warning;
    return colors.error;
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.scrollContainer}>
      <Text style={commonStyles.title}>Relatórios</Text>
      <Text style={commonStyles.caption}>
        Relatório consolidado - Espelho da aba GERAL da planilha
      </Text>

      {/* Totais (Denominadores) */}
      {denominadores && (
        <View style={[commonStyles.card, styles.totalsCard]}>
          <Text style={styles.totalsTitle}>📊 Totais de Reuniões Realizadas</Text>
          <View style={styles.totalsGrid}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>NORMAL</Text>
              <Text style={styles.totalValue}>{denominadores.totalNormal}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>OBRIGAÇÃO</Text>
              <Text style={styles.totalValue}>{denominadores.totalObrigacao}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>5ª</Text>
              <Text style={styles.totalValue}>{denominadores.total5a}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>SAB</Text>
              <Text style={styles.totalValue}>{denominadores.totalSAB}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>DOM</Text>
              <Text style={styles.totalValue}>{denominadores.totalDOM}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>TOTAL GERAL</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {denominadores.totalDias}
              </Text>
            </View>
          </View>
        </View>
      )}

      {data.length === 0 && !loading && (
        <View style={[commonStyles.card, { alignItems: 'center', padding: 48 }]}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📈</Text>
          <Text style={[commonStyles.caption, { textAlign: 'center' }]}>
            Sem dados para exibir
          </Text>
          <Text style={[commonStyles.caption, { marginTop: 8, fontSize: 14, textAlign: 'center' }]}>
            Cadastre reuniões e registre frequências para ver os relatórios
          </Text>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.memberId}
        contentContainerStyle={commonStyles.gap}
        refreshing={loading}
        onRefresh={load}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const member = members.find((m) => m.id === item.memberId);
          const showAmbas = member?.evaluationRule === 'AMBAS';
          
          return (
            <View style={commonStyles.card}>
              <View style={styles.reportHeader}>
                <View style={styles.reportIconContainer}>
                  <Text style={styles.reportIcon}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.cardTitle}>{member?.name ?? 'Membro'}</Text>
                  <View style={[commonStyles.row, { marginTop: 12 }]}>
                    <View style={[commonStyles.badge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[commonStyles.badgeText, { color: colors.primary }]}>
                        {member?.evaluationRule}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Frequências por Tipo (com inconsistência replicada) */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Frequências por Tipo</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>NORMAL</Text>
                    <Text style={[styles.statValue, { color: getPercentageColor(item.freqNormal) }]}>
                      {pct(item.freqNormal)}
                    </Text>
                    <Text style={styles.statNote}>*Agendado</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>OBRIG</Text>
                    <Text style={[styles.statValue, { color: getPercentageColor(item.freqObrigacao) }]}>
                      {pct(item.freqObrigacao)}
                    </Text>
                    <Text style={styles.statNote}>*Agendado</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>DOM</Text>
                    <Text style={[styles.statValue, { color: getPercentageColor(item.freqDom) }]}>
                      {pct(item.freqDom)}
                    </Text>
                    <Text style={styles.statNote}>*Agendado</Text>
                  </View>
                </View>
              </View>

              {/* Frequências por Dia (5ª, SAB, DOM, AMBAS) */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Frequências por Dia</Text>
                <View style={styles.statsGrid}>
                  {showAmbas ? (
                    <View style={[styles.statItem, styles.statItemWide]}>
                      <Text style={styles.statLabel}>AMBAS</Text>
                      <Text style={[styles.statValue, { color: getPercentageColor(item.freqAmbas) }]}>
                        {pct(item.freqAmbas)}
                      </Text>
                      <Text style={styles.statNote}>5ª + SAB</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>5ª</Text>
                        <Text style={[styles.statValue, { color: getPercentageColor(item.freq5a) }]}>
                          {pct(item.freq5a)}
                        </Text>
                        <Text style={styles.statNote}>Realizado</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>SAB</Text>
                        <Text style={[styles.statValue, { color: getPercentageColor(item.freqSab) }]}>
                          {pct(item.freqSab)}
                        </Text>
                        <Text style={styles.statNote}>Realizado</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>DOM</Text>
                        <Text style={[styles.statValue, { color: getPercentageColor(item.freqDomRealizado) }]}>
                          {pct(item.freqDomRealizado)}
                        </Text>
                        <Text style={styles.statNote}>Realizado</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Faltas */}
              <View style={styles.faltasSection}>
                <Text style={styles.sectionTitle}>Análise de Faltas</Text>
                <View style={styles.faltaItem}>
                  <Text style={styles.faltaLabel}>% Faltas Justificadas</Text>
                  <Text style={[styles.faltaValue, { color: colors.warning }]}>
                    {pct(item.percFaltasJust)}
                  </Text>
                </View>
                <View style={styles.faltaItem}>
                  <Text style={styles.faltaLabel}>% Faltas Sem Justificativa</Text>
                  <Text style={[styles.faltaValue, { color: colors.error }]}>
                    {pct(item.percFaltasSem)}
                  </Text>
                </View>
                <View style={[styles.faltaItem, styles.faltaItemTotal]}>
                  <Text style={styles.faltaLabelTotal}>Total de Faltas</Text>
                  <Text style={[styles.faltaValueTotal]}>
                    {item.totalFaltas}
                  </Text>
                </View>
              </View>

              {/* Detalhamento de Presenças */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalhamento</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Presenças NORMAL</Text>
                    <Text style={styles.detailValue}>{item.presencasNormal}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Presenças OBRIG</Text>
                    <Text style={styles.detailValue}>{item.presencasObrigacao}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Presenças 5ª</Text>
                    <Text style={styles.detailValue}>{item.presencas5a}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Presenças SAB</Text>
                    <Text style={styles.detailValue}>{item.presencasSab}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Faltas Justificadas</Text>
                    <Text style={[styles.detailValue, { color: colors.warning }]}>
                      {item.faltasJust}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Faltas Sem Justificativa</Text>
                    <Text style={[styles.detailValue, { color: colors.error }]}>
                      {item.faltasSem}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  totalsCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary + '20',
  },
  totalsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  totalItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportIcon: {
    fontSize: 24,
  },
  section: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
  },
  statItemWide: {
    minWidth: '100%',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statNote: {
    fontSize: 10,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  faltasSection: {
    marginTop: 8,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  faltaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  faltaItemTotal: {
    marginTop: 8,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  faltaLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  faltaLabelTotal: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  faltaValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  faltaValueTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
