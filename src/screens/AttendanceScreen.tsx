import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AttendanceRecord, Member, Meeting } from '../domain/types';
import { fetchAttendance, fetchMeetings, fetchMembers, upsertAttendance } from '../services/supabaseRepo';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

const JUSTIFICATIVAS_CACHE_KEY = '@frequencia_pro:justificativas';

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

// Função para salvar justificativa no cache
const saveJustificativaToCache = async (text: string) => {
  if (!text.trim()) return;
  try {
    const cached = await AsyncStorage.getItem(JUSTIFICATIVAS_CACHE_KEY);
    const justificativas: string[] = cached ? JSON.parse(cached) : [];
    // Adiciona se não existir e remove duplicatas
    const unique = [...new Set([text.trim(), ...justificativas])].slice(0, 20); // Mantém apenas as últimas 20
    await AsyncStorage.setItem(JUSTIFICATIVAS_CACHE_KEY, JSON.stringify(unique));
  } catch (err) {
    console.error('Erro ao salvar justificativa no cache:', err);
  }
};

// Função para buscar justificativas do cache
const getJustificativasFromCache = async (): Promise<string[]> => {
  try {
    const cached = await AsyncStorage.getItem(JUSTIFICATIVAS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (err) {
    console.error('Erro ao buscar justificativas do cache:', err);
    return [];
  }
};

export default function AttendanceScreen() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [justificationText, setJustificationText] = useState<{ [key: string]: string }>({});
  const [editingJustification, setEditingJustification] = useState<string | null>(null);
  const [cachedJustificativas, setCachedJustificativas] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);

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
      
      // Se a reunião selecionada foi excluída, selecionar a primeira disponível ou limpar
      if (selectedMeeting && !m.find(meeting => meeting.id === selectedMeeting.id)) {
        setSelectedMeeting(m.length > 0 ? m[0] : null);
      } else if (!selectedMeeting && m.length > 0) {
        setSelectedMeeting(m[0]);
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Carregar justificativas do cache
    getJustificativasFromCache().then(setCachedJustificativas);
  }, []);

  // Recarregar quando a aba receber foco (para sincronizar com mudanças na aba Reuniões)
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

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
      const justification = needsJustification ? justificationText[memberId] : undefined;
      
      // Salvar justificativa no cache
      if (justification?.trim()) {
        await saveJustificativaToCache(justification);
        // Atualizar lista de cache local
        const updated = await getJustificativasFromCache();
        setCachedJustificativas(updated);
      }
      
      await upsertAttendance({
        memberId,
        meetingId: selectedMeeting.id,
        status,
        justificationText: justification,
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

  // Função para atualizar justificativa e filtrar sugestões
  const handleJustificationChange = (memberId: string, text: string) => {
    setJustificationText({ ...justificationText, [memberId]: text });
    
    // Filtrar sugestões baseado no texto digitado (apenas se estiver editando este membro)
    if (editingJustification === memberId && text.trim().length > 0) {
      const filtered = cachedJustificativas.filter((j) =>
        j.toLowerCase().includes(text.toLowerCase())
      );
      setAutocompleteSuggestions(filtered.slice(0, 5)); // Máximo 5 sugestões
    } else {
      setAutocompleteSuggestions([]);
    }
  };

  // Função para selecionar uma sugestão
  const selectSuggestion = (memberId: string, suggestion: string) => {
    setJustificationText({ ...justificationText, [memberId]: suggestion });
    setAutocompleteSuggestions([]);
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Frequência</Text>
      <Text style={commonStyles.caption}>Registro de presenças e faltas</Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={[commonStyles.label, { marginBottom: 12 }]}>Selecione a Reunião</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={meetings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingRight: 4, paddingBottom: 4 }}
          renderItem={({ item }) => {
            const selected = selectedMeeting?.id === item.id;
            const dateBR = isoDateToBR(item.date);
            return (
              <TouchableOpacity
                onPress={() => setSelectedMeeting(item)}
                style={[
                  commonStyles.chip,
                  selected && commonStyles.chipActive,
                  { 
                    paddingVertical: 12, 
                    paddingHorizontal: 20,
                    minWidth: 140,
                    alignItems: 'center',
                  },
                ]}
              >
                <Text
                  style={[
                    commonStyles.chipText,
                    selected && commonStyles.chipTextActive,
                    { textAlign: 'center' },
                  ]}
                >
                  {dateBR} · {item.weekday}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={[commonStyles.card, { padding: 20, minWidth: 200 }]}>
              <Text style={[commonStyles.caption, { textAlign: 'center' }]}>
                Nenhuma reunião cadastrada
              </Text>
            </View>
          }
        />
      </View>

      {selectedMeeting && (
        <View style={[commonStyles.card, { marginBottom: 24, padding: 16, backgroundColor: colors.primary + '08' }]}>
          <Text style={[commonStyles.caption, { color: colors.textPrimary, fontSize: 14 }]}>
            {`📅 ${isoDateToBR(selectedMeeting.date)} · ${selectedMeeting.weekday} · ${selectedMeeting.kind}`}
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
          const isEditingJustification = editingJustification === item.id;
          const currentJustif = justificationText[item.id] || currentJustification(item.id);
          
          return (
            <View style={commonStyles.card}>
              {/* Nome e botões na mesma linha */}
              <View style={[commonStyles.row, { alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'space-between' }]}>
                {/* Nome do membro à esquerda */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[commonStyles.cardTitle, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                  </Text>
                  {status !== '—' && (
                    <View style={[commonStyles.badge, badge.style, { flexShrink: 0 }]}>
                      <Text style={[commonStyles.badgeText, badge.textStyle]}>
                        {`${badge.emoji} ${status}`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botões de ação à direita */}
                <View style={[commonStyles.row, { gap: 6, flexShrink: 0 }]}>
                  <TouchableOpacity
                    style={[styles.smallActionButton, styles.buttonOK, status === 'OK' && styles.buttonActive]}
                    onPress={() => mark(item.id, 'OK')}
                    disabled={loading}
                  >
                    <Text style={[styles.smallActionButtonText, status === 'OK' && styles.buttonActiveText]}>
                      ✅ OK
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.smallActionButton, styles.buttonFalta, status === 'FALTA_SEM' && styles.buttonActive]}
                    onPress={() => mark(item.id, 'FALTA_SEM')}
                    disabled={loading}
                  >
                    <Text style={[styles.smallActionButtonText, status === 'FALTA_SEM' && styles.buttonActiveText]}>
                      ❌ Falta
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.smallActionButton, styles.buttonJustificada, status === 'FALTA_JUST' && styles.buttonActive]}
                    onPress={() => {
                      if (currentJustif?.trim()) {
                        mark(item.id, 'FALTA_JUST', true);
                      } else {
                        setEditingJustification(item.id);
                        setAutocompleteSuggestions([]);
                      }
                    }}
                    disabled={loading}
                  >
                    <Text style={[styles.smallActionButtonText, status === 'FALTA_JUST' && styles.buttonActiveText]}>
                      ⚠️ Justificada
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Campo de justificativa com autocomplete */}
              {isEditingJustification && (
                <View style={styles.justificationInputBox}>
                  <Text style={styles.justificationLabel}>Justificativa</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="Digite o motivo da falta..."
                      placeholderTextColor={colors.textTertiary}
                      style={[commonStyles.input, styles.justificationInput]}
                      value={justificationText[item.id] || ''}
                      onChangeText={(text) => handleJustificationChange(item.id, text)}
                      multiline
                      autoFocus
                    />
                    {/* Sugestões de autocomplete */}
                    {autocompleteSuggestions.length > 0 && (
                      <View style={styles.autocompleteContainer}>
                        <ScrollView style={styles.autocompleteList} nestedScrollEnabled>
                          {autocompleteSuggestions.map((suggestion, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.autocompleteItem}
                              onPress={() => selectSuggestion(item.id, suggestion)}
                            >
                              <Text style={styles.autocompleteText}>{suggestion}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <View style={commonStyles.row}>
                    <TouchableOpacity
                      style={[styles.smallButton, styles.buttonCancel]}
                      onPress={() => {
                        setEditingJustification(null);
                        setJustificationText({ ...justificationText, [item.id]: '' });
                        setAutocompleteSuggestions([]);
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
                          setAutocompleteSuggestions([]);
                        } else {
                          Alert.alert('Atenção', 'Informe a justificativa');
                        }
                      }}
                    >
                      <Text style={styles.smallButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Exibir justificativa salva (quando não está editando) */}
              {!isEditingJustification && currentJustif && (
                <View style={styles.justificationBox}>
                  <Text style={styles.justificationLabel}>Justificativa</Text>
                  <Text style={styles.justificationText}>{currentJustif}</Text>
                  <TouchableOpacity
                    style={styles.editJustificationButton}
                    onPress={() => {
                      setEditingJustification(item.id);
                      setAutocompleteSuggestions([]);
                    }}
                  >
                    <Text style={styles.editJustificationText}>✏️ Editar</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  // Botões pequenos antes do nome
  smallActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    minWidth: 60,
  },
  buttonOK: {
    backgroundColor: colors.success + '15',
    borderColor: colors.success,
  },
  buttonFalta: {
    backgroundColor: colors.error + '15',
    borderColor: colors.error,
  },
  buttonJustificada: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning,
  },
  buttonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  smallActionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  buttonActiveText: {
    color: colors.surface,
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
  inputContainer: {
    position: 'relative',
  },
  justificationInput: {
    marginBottom: 0,
    marginTop: 8,
    minHeight: 80,
  },
  autocompleteContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  autocompleteList: {
    maxHeight: 150,
  },
  autocompleteItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  autocompleteText: {
    fontSize: 14,
    color: colors.textPrimary,
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
    marginBottom: 8,
  },
  editJustificationButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  editJustificationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
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
