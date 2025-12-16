import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Meeting, MeetingKind, WeekdayKind } from '../domain/types';
import { addMeeting, fetchMeetings } from '../services/supabaseRepo';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

// Função para converter data brasileira (dd/mm/aaaa) para ISO (aaaa-mm-dd)
function brDateToISO(brDate: string): string | null {
  const parts = brDate.split('/');
  if (parts.length !== 3) return null;
  
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  
  // Validar se é uma data válida
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return null;
  
  return `${year}-${month}-${day}`;
}

// Função para converter data ISO (aaaa-mm-dd) para brasileira (dd/mm/aaaa)
function isoDateToBR(isoDate: string): string {
  try {
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  } catch {
    return isoDate;
  }
}

// Função para aplicar máscara de data (dd/mm/aaaa)
function applyDateMask(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
}

// Função para aplicar máscara de hora (hh:mm)
function applyTimeMask(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara
  if (numbers.length <= 2) {
    return numbers;
  } else {
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  }
}

// Função para detectar o dia da semana automaticamente
function getWeekdayFromDate(dateStr: string): WeekdayKind | null {
  try {
    // Se for formato brasileiro, converter para ISO primeiro
    let isoDate = dateStr;
    if (dateStr.includes('/')) {
      const converted = brDateToISO(dateStr);
      if (!converted) return null;
      isoDate = converted;
    }
    
    const date = new Date(isoDate);
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
    // Aplica máscara automática
    const masked = applyDateMask(text);
    setDate(masked);
    
    // Detectar automaticamente o dia da semana quando a data for válida (dd/mm/aaaa = 10 caracteres)
    if (masked.length === 10) {
      const detectedWeekday = getWeekdayFromDate(masked);
      if (detectedWeekday) {
        setWeekday(detectedWeekday);
      }
    }
  };

  const handleTimeChange = (text: string) => {
    // Aplica máscara automática
    const masked = applyTimeMask(text);
    setTime(masked);
  };

  const handleAdd = async () => {
    if (!date) {
      Alert.alert('Atenção', 'Informe a data (dd/mm/aaaa)');
      return;
    }

    // Validar formato de data brasileira
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Atenção', 'Formato de data inválido. Use dd/mm/aaaa (ex: 20/01/2025)');
      return;
    }

    // Converter para ISO antes de salvar
    const isoDate = brDateToISO(date);
    if (!isoDate) {
      Alert.alert('Atenção', 'Data inválida. Verifique se a data existe (ex: 20/01/2025)');
      return;
    }

    // Validar formato de hora brasileira (hh:mm)
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert('Atenção', 'Formato de hora inválido. Use hh:mm (ex: 14:30)');
      return;
    }

    // Validar hora (00:00 a 23:59)
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        Alert.alert('Atenção', 'Hora inválida. Use valores entre 00:00 e 23:59');
        return;
      }
    }

    setLoading(true);
    try {
      await addMeeting({ date: isoDate, time: time || undefined, weekday, kind });
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

  const formatDateBR = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoDateToBR(isoDate);
    }
  };

  const formatTimeBR = (time: string | undefined) => {
    if (!time) return '';
    return time; // Já está no formato hh:mm
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Reuniões</Text>
      <Text style={commonStyles.caption}>Agende e gerencie suas reuniões</Text>

      <View style={[commonStyles.card, styles.formCard]}>
        <Text style={styles.formTitle}>Nova Reunião</Text>
        
        <TextInput
          placeholder="Data (dd/mm/aaaa)"
          placeholderTextColor={colors.textTertiary}
          style={[
            commonStyles.input,
            focusedInput === 'date' && commonStyles.inputFocused,
          ]}
          value={date}
          onChangeText={handleDateChange}
          onFocus={() => setFocusedInput('date')}
          onBlur={() => setFocusedInput(null)}
          keyboardType="numeric"
          maxLength={10}
        />
        {date && date.length === 10 && (
          <Text style={styles.dateHint}>
            📅 {formatDateBR(brDateToISO(date) || date)}
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
          onChangeText={handleTimeChange}
          onFocus={() => setFocusedInput('time')}
          onBlur={() => setFocusedInput(null)}
          keyboardType="numeric"
          maxLength={5}
        />
        {time && time.length === 5 && (
          <Text style={styles.timeHint}>
            ⏰ {time}
          </Text>
        )}

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
          const dateBR = isoDateToBR(item.date);
          return (
            <View style={[commonStyles.card, isPast && styles.pastMeeting]}>
              <View style={styles.meetingHeader}>
                <View style={styles.meetingIconContainer}>
                  <Text style={styles.meetingIcon}>📅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.cardTitle}>
                    {formatDateBR(item.date)} {item.time ? `às ${formatTimeBR(item.time)}` : ''}
                  </Text>
                  <Text style={styles.dateDisplay}>
                    {dateBR} {item.time ? `• ${item.time}` : ''}
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
  timeHint: {
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
  dateDisplay: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  pastMeeting: {
    opacity: 0.7,
    backgroundColor: colors.surfaceElevated,
  },
});
