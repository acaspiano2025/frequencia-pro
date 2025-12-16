import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AttendanceRecord, Member, Meeting } from '../domain/types';
import { fetchAttendance, fetchMeetings, fetchMembers, upsertAttendance } from '../services/supabaseRepo';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

export default function AttendanceScreen() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [justificationText, setJustificationText] = useState<{ [key: string]: string }>({});
  const [editingJustification, setEditingJustification] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [m, mem, att] = await Promise.all([
        fetchMeetings(),
        fetchMembers(),
        fetchAttendance(),
      ]);
      setMeetings(m.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setMembers(mem);
      setAttendance(att);
      if (!selectedMeeting && m.length > 0) setSelectedMeeting(m[0]);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Carregar justificativas existentes quando a reunião selecionada mudar
  useEffect(() => {
    if (selectedMeeting && attendance.length > 0) {
      const justifications: { [key: string]: string } = {};
      attendance
        .filter((a) => a.meetingId === selectedMeeting.id && a.justificationText)
        .forEach((a) => {
          justifications[a.memberId] = a.justificationText || '';
        });
      setJustificationText(justifications);
    }
  }, [selectedMeeting, attendance]);

  const currentStatus = (memberId: string): AttendanceRecord['status'] | '—' => {
    if (!selectedMeeting) return '—';
    const rec = attendance.find(
      (r) => r.memberId === memberId && r.meetingId === selectedMeeting.id,
    );
    return rec?.status ?? '—';
  };

  const currentJustification = (memberId: string): string | null => {
    if (!selectedMeeting) return null;
    const rec = attendance.find(
      (r) => r.memberId === memberId && r.meetingId === selectedMeeting.id,
    );
    return rec?.justificationText ?? null;
  };

  const mark = async (
    memberId: string,
    status: AttendanceRecord['status'],
    needsJustification = false,
  ) => {
    if (!selectedMeeting) {
      Alert.alert('Atenção', 'Selecione uma reunião');
      return;
    }
    
    if (needsJustification && !justificationText[memberId]?.trim()) {
      Alert.alert('Atenção', 'Informe a justificativa');
      return;
    }
    
    setLoading(true);
    try {
      await upsertAttendance({
        memberId,
        meetingId: selectedMeeting.id,
        status,
        justificationText: needsJustification ? justificationText[memberId] : undefined,
      });
      await load();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao registrar presença');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: AttendanceRecord['status'] | '—') => {
    if (status === 'OK') {
      return { style: commonStyles.badgeSuccess, textStyle: commonStyles.badgeTextSuccess, emoji: '✅' };
    }
    if (status === 'FALTA_JUST') {
      return { style: commonStyles.badgeWarning, textStyle: commonStyles.badgeTextWarning, emoji: '⚠️' };
    }
    if (status === 'FALTA_SEM') {
      return { style: commonStyles.badgeError, textStyle: commonStyles.badgeTextError, emoji: '❌' };
    }
    return { style: commonStyles.badge, textStyle: { color: colors.textTertiary }, emoji: '—' };
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Frequência</Text>
      <Text style={commonStyles.caption}>Registro de presenças e faltas</Text>

      <Text style={[commonStyles.label, { marginBottom: 12 }]}>Selecione a Reunião</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={meetings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, marginBottom: 24, paddingRight: 4 }}
        renderItem={({ item }) => {
          const selected = selectedMeeting?.id === item.id;
          return (
            <TouchableOpacity
              onPress={() => setSelectedMeeting(item)}
              style={[
                commonStyles.chip,
                selected && commonStyles.chipActive,
                { paddingVertical: 12, paddingHorizontal: 20 },
              ]}
            >
              <Text
                style={[
                  commonStyles.chipText,
                  selected && commonStyles.chipTextActive,
                ]}
              >
                {item.date} · {item.weekday}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={[commonStyles.card, { padding: 20 }]}>
            <Text style={commonStyles.caption}>Nenhuma reunião cadastrada</Text>
          </View>
        }
      />

      {selectedMeeting && (
        <View style={[commonStyles.card, { marginBottom: 24, padding: 16, backgroundColor: colors.primary + '08' }]}>
          <Text style={[commonStyles.caption, { color: colors.textPrimary, fontSize: 14 }]}>
            📅 {selectedMeeting.date} · {selectedMeeting.weekday} · {selectedMeeting.kind}
          </Text>
        </View>
      )}

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.gap}
        renderItem={({ item }) => {
          const status = currentStatus(item.id);
          const badge = getStatusBadge(status);
          return (
            <View style={commonStyles.card}>
              <View style={commonStyles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.cardTitle}>{item.name}</Text>
                </View>
                <View style={[commonStyles.badge, badge.style]}>
                  <Text style={[commonStyles.badgeText, badge.textStyle]}>
                    {badge.emoji} {status}
                  </Text>
                </View>
              </View>

              <View style={[commonStyles.row, { marginTop: 16, gap: 8 }]}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.buttonOK]}
                  onPress={() => mark(item.id, 'OK')}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>✅ OK</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.buttonFalta]}
                  onPress={() => mark(item.id, 'FALTA_SEM')}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>❌ Falta</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.buttonJustificada]}
                  onPress={() => {
                    if (justificationText[item.id]?.trim()) {
                      mark(item.id, 'FALTA_JUST', true);
                    } else {
                      setEditingJustification(item.id);
                    }
                  }}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>⚠️ Justificada</Text>
                </TouchableOpacity>
              </View>

              {editingJustification === item.id ? (
                <View style={styles.justificationInputBox}>
                  <Text style={styles.justificationLabel}>Justificativa</Text>
                  <TextInput
                    placeholder="Motivo da falta..."
                    placeholderTextColor={colors.textTertiary}
                    style={[commonStyles.input, { marginBottom: 12, marginTop: 8 }]}
                    value={justificationText[item.id] || ''}
                    onChangeText={(text) =>
                      setJustificationText({ ...justificationText, [item.id]: text })
                    }
                    multiline
                  />
                  <View style={commonStyles.row}>
                    <TouchableOpacity
                      style={[styles.smallButton, styles.buttonCancel]}
                      onPress={() => {
                        setEditingJustification(null);
                        setJustificationText({ ...justificationText, [item.id]: '' });
                      }}
                    >
                      <Text style={styles.smallButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallButton, styles.buttonConfirm]}
                      onPress={() => {
                        if (justificationText[item.id]?.trim()) {
                          mark(item.id, 'FALTA_JUST', true);
                          setEditingJustification(null);
                        } else {
                          Alert.alert('Atenção', 'Informe a justificativa');
                        }
                      }}
                    >
                      <Text style={styles.smallButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (justificationText[item.id] || currentJustification(item.id)) ? (
                <View style={styles.justificationBox}>
                  <Text style={styles.justificationLabel}>Justificativa</Text>
                  <Text style={styles.justificationText}>
                    {justificationText[item.id] || currentJustification(item.id)}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={[commonStyles.card, { alignItems: 'center', padding: 48 }]}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>👥</Text>
            <Text style={[commonStyles.caption, { textAlign: 'center' }]}>
              Nenhum membro cadastrado
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOK: {
    backgroundColor: colors.success + '15',
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  buttonFalta: {
    backgroundColor: colors.error + '15',
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  buttonJustificada: {
    backgroundColor: colors.warning + '15',
    borderWidth: 1.5,
    borderColor: colors.warning,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  justificationBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  justificationInputBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  justificationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  justificationText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  buttonConfirm: {
    backgroundColor: colors.warning,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
