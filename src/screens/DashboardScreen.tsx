import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Pressable } from 'react-native';

import { atualizarFrequenciaPorPessoa, contagemMacro } from '../domain/frequency';
import { useUser } from '../contexts/UserContext';
import { createUser, fetchOperators, updateUser } from '../services/supabaseRepo';
import { fetchAttendance, fetchMeetings, fetchMembers } from '../services/supabaseRepo';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';
import { User } from '../domain/types';

export default function DashboardScreen() {
  const { user, canManageOperators, refreshUser } = useUser();
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
  
  // Estados para cadastro de operadores
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showOperatorsList, setShowOperatorsList] = useState(false);
  const [operators, setOperators] = useState<User[]>([]);
  const [operatorEmail, setOperatorEmail] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [editingOperator, setEditingOperator] = useState<User | null>(null);
  const [operatorLoading, setOperatorLoading] = useState(false);

  // Fechar menu dropdown quando clicar fora
  useEffect(() => {
    if (showMenuDropdown) {
      const timer = setTimeout(() => {
        // Fechar automaticamente após 5 segundos ou quando necessário
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showMenuDropdown]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [meetings, members, attendance] = await Promise.all([
          fetchMeetings(),
          fetchMembers(),
          fetchAttendance(),
        ]);
        
        // Carregar operadores se o usuário pode gerenciá-los
        if (canManageOperators()) {
          const ops = await fetchOperators();
          setOperators(ops);
        }

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
  }, [canManageOperators]);
  
  const handleOpenOperatorModal = () => {
    setOperatorEmail('');
    setOperatorName('');
    setEditingOperator(null);
    setShowOperatorModal(true);
  };
  
  const handleCloseOperatorModal = () => {
    setShowOperatorModal(false);
    setOperatorEmail('');
    setOperatorName('');
    setEditingOperator(null);
  };
  
  const handleEditOperator = (operator: User) => {
    setOperatorEmail(operator.email);
    setOperatorName(operator.nome_completo);
    setEditingOperator(operator);
    setShowOperatorModal(true);
  };
  
  const handleSaveOperator = async () => {
    if (!operatorEmail || !operatorName) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    
    // Validar se é Gmail
    if (!operatorEmail.toLowerCase().endsWith('@gmail.com')) {
      Alert.alert('Erro', 'Apenas emails Gmail são permitidos.');
      return;
    }
    
    if (!user) {
      Alert.alert('Erro', 'Usuário não encontrado.');
      return;
    }
    
    setOperatorLoading(true);
    try {
      if (editingOperator) {
        // Editar operador existente
        await updateUser(editingOperator.id, {
          nome_completo: operatorName.trim(),
        });
        Alert.alert('Sucesso', 'Operador atualizado com sucesso!');
      } else {
        // Criar novo operador
        await createUser({
          email: operatorEmail.trim(),
          nome_completo: operatorName.trim(),
          perfil: 'Operador',
          cadastrado_por: user.id,
        });
        Alert.alert('Sucesso', 'Operador cadastrado com sucesso!');
      }
      
      // Recarregar lista de operadores
      const ops = await fetchOperators();
      setOperators(ops);
      handleCloseOperatorModal();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar operador.');
    } finally {
      setOperatorLoading(false);
    }
  };
  
  const handleToggleOperatorStatus = async (operator: User) => {
    const newStatus = operator.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const action = newStatus === 'Ativo' ? 'ativar' : 'desativar';
    
    Alert.alert(
      'Confirmar',
      `Tem certeza que deseja ${action} o operador ${operator.nome_completo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateUser(operator.id, { status: newStatus });
              const ops = await fetchOperators();
              setOperators(ops);
              Alert.alert('Sucesso', `Operador ${action}do com sucesso!`);
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao atualizar operador.');
            }
          },
        },
      ]
    );
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return '—';
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <ScrollView 
      style={commonStyles.container}
      contentContainerStyle={commonStyles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={commonStyles.title}>Dashboard</Text>
          <Text style={commonStyles.caption}>Visão geral do sistema de frequência</Text>
        </View>
        
        {/* Menu Dropdown - Visível apenas para Admin e Programador */}
        {canManageOperators() && (
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenuDropdown(!showMenuDropdown)}
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
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
        
        {/* Lista de Operadores - Visível apenas para Admin e Programador */}
        {canManageOperators() && showOperatorsList && operators.length > 0 && (
          <View style={[commonStyles.card, styles.operatorsCard]}>
            <Text style={styles.operatorsTitle}>Operadores Cadastrados</Text>
            {operators.map((operator) => (
              <View key={operator.id} style={styles.operatorItem}>
                <View style={styles.operatorInfo}>
                  <Text style={styles.operatorName}>{operator.nome_completo}</Text>
                  <Text style={styles.operatorEmail}>{operator.email}</Text>
                  <View style={styles.operatorBadges}>
                    <View style={[
                      commonStyles.badge,
                      operator.status === 'Ativo' ? commonStyles.badgeSuccess : commonStyles.badgeError
                    ]}>
                      <Text style={[
                        commonStyles.badgeText,
                        operator.status === 'Ativo' ? commonStyles.badgeTextSuccess : commonStyles.badgeTextError
                      ]}>
                        {operator.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.operatorActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditOperator(operator)}
                  >
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      operator.status === 'Ativo' ? styles.deactivateButton : styles.activateButton
                    ]}
                    onPress={() => handleToggleOperatorStatus(operator)}
                  >
                    <Text style={styles.actionButtonText}>
                      {operator.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {/* Modal do Menu Dropdown */}
      <Modal
        visible={showMenuDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenuDropdown(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMenuDropdown(false)}
        >
          <View style={styles.dropdownMenuContainer}>
            <Pressable
              style={styles.dropdownItem}
              onPress={() => {
                handleOpenOperatorModal();
                setShowMenuDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>➕ Cadastrar Operador</Text>
            </Pressable>
            <Pressable
              style={styles.dropdownItem}
              onPress={() => {
                setShowOperatorsList(!showOperatorsList);
                setShowMenuDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>
                {showOperatorsList ? '👁️ Ocultar Operadores' : '👁️ Ver Operadores'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de Cadastro/Edição de Operador */}
      <Modal
        visible={showOperatorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseOperatorModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingOperator ? 'Editar Operador' : 'Cadastrar Novo Operador'}
            </Text>
            
            <Text style={commonStyles.label}>Email (Gmail) *</Text>
            <TextInput
              placeholder="exemplo@gmail.com"
              placeholderTextColor={colors.textTertiary}
              style={commonStyles.input}
              value={operatorEmail}
              onChangeText={setOperatorEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!editingOperator}
            />
            
            <Text style={commonStyles.label}>Nome Completo *</Text>
            <TextInput
              placeholder="Nome completo do operador"
              placeholderTextColor={colors.textTertiary}
              style={commonStyles.input}
              value={operatorName}
              onChangeText={setOperatorName}
              autoCapitalize="words"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[commonStyles.button, styles.cancelButton]}
                onPress={handleCloseOperatorModal}
              >
                <Text style={[commonStyles.buttonText, { color: colors.textPrimary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.button, commonStyles.buttonPrimary, operatorLoading && commonStyles.buttonDisabled]}
                onPress={handleSaveOperator}
                disabled={operatorLoading}
              >
                <Text style={commonStyles.buttonText}>
                  {operatorLoading ? 'Salvando...' : editingOperator ? 'Atualizar' : 'Cadastrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: 16,
    paddingBottom: 20,
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  menuContainer: {
    position: 'relative',
    marginTop: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  dropdownMenuContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
    minWidth: 220,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  operatorsCard: {
    padding: 20,
  },
  operatorsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  operatorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  operatorInfo: {
    flex: 1,
    marginRight: 12,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  operatorEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  operatorBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  operatorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  activateButton: {
    backgroundColor: colors.success + '15',
    borderColor: colors.success,
  },
  deactivateButton: {
    backgroundColor: colors.error + '15',
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});
