import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Meeting, MeetingKind, WeekdayKind } from '../domain/types';
import { addMeeting, fetchMeetings } from '../services/supabaseRepo';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

// Função para detectar o dia da semana automaticamente
function getWeekdayFromDate(dateStr: string): WeekdayKind | null {
  try {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    
    if (day === 4) return '5A'; // Quinta-feira
    if (day === 6) return 'SAB'; // Sábado
    if (day === 0) return 'DOM'; // Domingo
    
    return null; // Outros dias não são suportados
  } catch {
    return null;
  }
}

export default function MeetingsScreen() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [weekday, setWeekday] = useState<WeekdayKind>('5A');
  const [kind, setKind] = useState<MeetingKind>('NORMAL');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMeetings();
      setMeetings(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao carregar reuniões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDateChange = (text: string) => {
    setDate(text);
    // Detectar automaticamente o dia da semana quando a data for válida
    if (text.length === 10) { // yyyy-mm-dd
      const detectedWeekday = getWeekdayFromDate(text);
      if (detectedWeekday) {
        setWeekday(detectedWeekday);
      }
    }
  };

  const handleAdd = async () => {
    if (!date) {
      Alert.alert('Atenção', 'Informe a data (yyyy-mm-dd)');
      return;
    }

    // Validar formato de data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Atenção', 'Formato de data inválido. Use yyyy-mm-dd (ex: 2025-12-20)');
      return;
    }

    // Validar formato de hora se informada
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert('Atenção', 'Formato de hora inválido. Use hh:mm (ex: 14:30)');
      return;
    }

    setLoading(true);
    try {
      await addMeeting({ date, time: time || undefined, weekday, kind });
      setDate('');
      setTime('');
      Alert.alert('Sucesso', 'Reunião cadastrada com sucesso!');
      await load();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao salvar reunião');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Reuniões</Text>
      <Text style={commonStyles.caption}>Agende e gerencie suas reuniões</Text>

      <View style={[commonStyles.card, styles.formCard]}>
        <Text style={styles.formTitle}>Nova Reunião</Text>
        
        <TextInput
          placeholder="Data (yyyy-mm-dd)"
          placeholderTextColor={colors.textTertiary}
          style={[
            commonStyles.input,
            focusedInput === 'date' && commonStyles.inputFocused,
          ]}
          value={date}
          onChangeText={handleDateChange}
          onFocus={() => setFocusedInput('date')}
          onBlur={() => setFocusedInput(null)}
        />
        {date && date.length === 10 && (
          <Text style={styles.dateHint}>
            📅 {formatDate(date)}
          </Text>
        )}
        
        <TextInput
          placeholder="Hora (hh:mm) - opcional"
          placeholderTextColor={colors.textTertiary}
          style={[
            commonStyles.input,
            focusedInput === 'time' && commonStyles.inputFocused,
          ]}
          value={time}
          onChangeText={setTime}
          onFocus={() => setFocusedInput('time')}
          onBlur={() => setFocusedInput(null)}
        />

        <View style={styles.selectorGroup}>
          <Text style={commonStyles.label}>Dia da Semana</Text>
          <Text style={[commonStyles.caption, { marginBottom: 12, fontSize: 13 }]}>
            {date && date.length === 10 && getWeekdayFromDate(date)
              ? 'Detectado automaticamente da data'
              : 'Selecione o dia da semana'}
          </Text>
          <View style={commonStyles.row}>
            {(['5A', 'SAB', 'DOM'] as WeekdayKind[]).map((w) => (
              <TouchableOpacity
                key={w}
                style={[
                  commonStyles.chip,
                  w === weekday && commonStyles.chipActive,
                ]}
                onPress={() => setWeekday(w)}
              >
                <Text
                  style={[
                    commonStyles.chipText,
                    w === weekday && commonStyles.chipTextActive,
                  ]}
                >
                  {w}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.selectorGroup}>
          <Text style={commonStyles.label}>Tipo de Reunião</Text>
          <View style={commonStyles.row}>
            {(['NORMAL', 'OBRIGACAO', 'DESENVOLVIMENTO'] as MeetingKind[]).map((k) => (
              <TouchableOpacity
                key={k}
                style={[
                  commonStyles.chip,
                  k === kind && commonStyles.chipActive,
                ]}
                onPress={() => setKind(k)}
              >
                <Text
                  style={[
                    commonStyles.chipText,
                    k === kind && commonStyles.chipTextActive,
                  ]}
                >
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            commonStyles.button,
            commonStyles.buttonPrimary,
            loading && commonStyles.buttonDisabled,
          ]}
          onPress={handleAdd}
          disabled={loading}
        >
          <Text style={commonStyles.buttonText}>
            {loading ? 'Salvando...' : '➕ Adicionar Reunião'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[commonStyles.subtitle, { marginTop: 8, marginBottom: 16 }]}>
        Reuniões Cadastradas ({meetings.length})
      </Text>

      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.gap}
        renderItem={({ item }) => {
          const isPast = new Date(item.date) < new Date();
          return (
            <View style={[commonStyles.card, isPast && styles.pastMeeting]}>
              <View style={styles.meetingHeader}>
                <View style={styles.meetingIconContainer}>
                  <Text style={styles.meetingIcon}>📅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.cardTitle}>
                    {formatDate(item.date)} {item.time ? `às ${item.time}` : ''}
                  </Text>
                  <View style={[commonStyles.row, { marginTop: 12 }]}>
                    <View style={[commonStyles.badge, commonStyles.badgeSuccess]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>
                        {item.weekday}
                      </Text>
                    </View>
                    <View style={[commonStyles.badge, commonStyles.badgeWarning]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextWarning]}>
                        {item.kind}
                      </Text>
                    </View>
                    {isPast && (
                      <View style={[commonStyles.badge, { backgroundColor: colors.textTertiary + '20' }]}>
                        <Text style={[commonStyles.badgeText, { color: colors.textTertiary }]}>
                          Realizada
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={[commonStyles.card, { alignItems: 'center', padding: 48 }]}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>📭</Text>
            <Text style={[commonStyles.caption, { textAlign: 'center' }]}>
              Nenhuma reunião cadastrada
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
  formCard: {
    marginBottom: 24,
    padding: 24,
  },
  formTitle: {
    ...commonStyles.subtitle,
    marginBottom: 20,
  },
  selectorGroup: {
    marginBottom: 20,
  },
  dateHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: -12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  meetingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingIcon: {
    fontSize: 24,
  },
  pastMeeting: {
    opacity: 0.7,
    backgroundColor: colors.surfaceElevated,
  },
});
