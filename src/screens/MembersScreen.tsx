import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Member } from '../domain/types';
import { addMember, deleteMember, fetchMembers, updateMember } from '../services/supabaseRepo';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

// Função para normalizar texto (remove acentos e converte para minúsculas)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Função de busca inteligente
const searchMembers = (members: Member[], searchTerm: string): Member[] => {
  if (!searchTerm.trim()) return members;
  
  const normalizedSearch = normalizeText(searchTerm);
  
  return members.filter((member) => {
    const normalizedName = normalizeText(member.name);
    return normalizedName.includes(normalizedSearch);
  });
};

export default function MembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [evaluationRule, setEvaluationRule] = useState<Member['evaluationRule']>('AMBAS');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filtrar membros baseado na pesquisa (em tempo real)
  const filteredMembers = useMemo(() => {
    return searchMembers(members, searchTerm);
  }, [members, searchTerm]);

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome.');
      return;
    }
    setLoading(true);
    try {
      await addMember({ name: name.trim(), evaluationRule });
      setName('');
      setEvaluationRule('AMBAS');
      Alert.alert('Sucesso', 'Membro adicionado com sucesso!');
      await load();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao salvar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setEvaluationRule(member.evaluationRule);
    setSelectedMemberId(member.id);
    // Scroll para o topo do formulário (opcional)
  };

  const handleSelectMember = (memberId: string) => {
    // Se já está selecionado, desseleciona
    if (selectedMemberId === memberId) {
      setSelectedMemberId(null);
      // Se estava editando, cancela a edição
      if (editingMember?.id === memberId) {
        cancelEdit();
      }
    } else {
      // Seleciona o novo membro
      setSelectedMemberId(memberId);
    }
  };

  const handleUpdate = async () => {
    if (!editingMember || !name.trim()) {
      Alert.alert('Atenção', 'Informe o nome.');
      return;
    }
    setLoading(true);
    try {
      await updateMember(editingMember.id, {
        name: name.trim(),
        evaluationRule,
      });
      setEditingMember(null);
      setSelectedMemberId(null);
      setName('');
      setEvaluationRule('AMBAS');
      Alert.alert('Sucesso', 'Membro atualizado com sucesso!');
      await load();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao atualizar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (member: Member) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o membro "${member.name}"?\n\nEsta ação não pode ser desfeita e todos os registros de frequência relacionados serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteMember(member.id);
              setSelectedMemberId(null);
              if (editingMember?.id === member.id) {
                setEditingMember(null);
                setName('');
                setEvaluationRule('AMBAS');
              }
              Alert.alert('Sucesso', 'Membro excluído com sucesso!');
              await load();
            } catch (err: any) {
              Alert.alert('Erro', err.message ?? 'Falha ao excluir membro');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setSelectedMemberId(null);
    setName('');
    setEvaluationRule('AMBAS');
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getRuleBadge = (rule: Member['evaluationRule']) => {
    const badges = {
      AMBAS: { emoji: '📊', color: colors.primary, description: 'Avalia 5ª e Sábado juntos' },
      '5A': { emoji: '📅', color: colors.success, description: 'Avalia apenas 5ª feira' },
      SAB: { emoji: '🗓️', color: colors.warning, description: 'Avalia apenas Sábado' },
    };
    return badges[rule] || badges.AMBAS;
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={commonStyles.title}>Membros</Text>
      <Text style={commonStyles.caption}>
        Gerencie membros e regras de avaliação (equivalente à Coluna B da planilha)
      </Text>

      <View style={[commonStyles.card, styles.formCard]}>
        <Text style={styles.formTitle}>
          {editingMember ? 'Editar Membro' : 'Novo Membro'}
        </Text>
        
        <TextInput
          placeholder="Nome do membro"
          placeholderTextColor={colors.textTertiary}
          style={[
            commonStyles.input,
            focusedInput && commonStyles.inputFocused,
          ]}
          value={name}
          onChangeText={setName}
          onFocus={() => setFocusedInput(true)}
          onBlur={() => setFocusedInput(false)}
        />

        <View style={styles.selectorGroup}>
          <Text style={commonStyles.label}>Regra de Avaliação</Text>
          <Text style={[commonStyles.caption, { marginBottom: 16, fontSize: 14 }]}>
            Define como a frequência será calculada para este membro
          </Text>
          <View style={commonStyles.row}>
            {(['AMBAS', '5A', 'SAB'] as Member['evaluationRule'][]).map((rule) => {
              const badge = getRuleBadge(rule);
              const isActive = rule === evaluationRule;
              return (
                <TouchableOpacity
                  key={rule}
                  style={[
                    commonStyles.chip,
                    isActive && { backgroundColor: badge.color, borderColor: badge.color },
                    { flex: 1, alignItems: 'center' },
                  ]}
                  onPress={() => setEvaluationRule(rule)}
                >
                  <Text
                    style={[
                      commonStyles.chipText,
                      isActive && commonStyles.chipTextActive,
                    ]}
                  >
                    {badge.emoji} {rule}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[commonStyles.caption, { marginTop: 8, fontSize: 12 }]}>
            {getRuleBadge(evaluationRule).description}
          </Text>
        </View>

        <View style={commonStyles.row}>
          {editingMember && (
            <TouchableOpacity
              style={[
                commonStyles.button,
                { flex: 1, marginRight: 8, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
              ]}
              onPress={cancelEdit}
            >
              <Text style={[commonStyles.buttonText, { color: colors.textPrimary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              commonStyles.button,
              commonStyles.buttonPrimary,
              loading && commonStyles.buttonDisabled,
              { flex: editingMember ? 1 : undefined },
            ]}
            onPress={editingMember ? handleUpdate : handleAdd}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>
              {loading
                ? 'Salvando...'
                : editingMember
                  ? '💾 Atualizar Membro'
                  : '➕ Adicionar Membro'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Campo de Pesquisa */}
      <View style={[commonStyles.card, styles.searchCard]}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Pesquisar membro por nome..."
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {searchTerm.length > 0 && (
          <Text style={styles.searchResults}>
            {filteredMembers.length} {filteredMembers.length === 1 ? 'membro encontrado' : 'membros encontrados'}
          </Text>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={[commonStyles.subtitle, { marginBottom: 0 }]}>
          Membros Cadastrados
        </Text>
        <View style={[commonStyles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[commonStyles.badgeText, { color: colors.primary }]}>
            {(() => {
              const count = searchTerm ? filteredMembers.length : members.length;
              return `${count} ${count === 1 ? 'membro' : 'membros'}`;
            })()}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.gap}
        renderItem={({ item }) => {
          const badge = getRuleBadge(item.evaluationRule);
          const isSelected = selectedMemberId === item.id;
          return (
            <TouchableOpacity
              style={[
                commonStyles.card,
                isSelected && styles.selectedCard,
              ]}
              onPress={() => handleSelectMember(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.memberHeader}>
                <View style={styles.memberIconContainer}>
                  <Text style={styles.memberIcon}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.cardTitle}>{item.name}</Text>
                  <View style={[commonStyles.row, { marginTop: 12 }]}>
                    <View style={[commonStyles.badge, { backgroundColor: badge.color + '20' }]}>
                      <Text style={[commonStyles.badgeText, { color: badge.color }]}>
                        {badge.emoji} {item.evaluationRule}
                      </Text>
                    </View>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </View>
              
              {/* Botões de Ação - Só aparecem quando selecionado */}
              {isSelected && (
                <View style={styles.actionsContainer}>
                  <Text style={styles.actionsLabel}>Ações:</Text>
                  <View style={[commonStyles.row, { gap: 8 }]}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEdit(item)}
                      disabled={loading}
                    >
                      <Text style={styles.actionButtonText}>✏️ Alterar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(item)}
                      disabled={loading}
                    >
                      <Text style={styles.actionButtonText}>🗑️ Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={[commonStyles.card, { alignItems: 'center', padding: 48 }]}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>
              {searchTerm ? '🔍' : '👥'}
            </Text>
            <Text style={[commonStyles.caption, { textAlign: 'center', marginBottom: 8 }]}>
              {searchTerm
                ? `Nenhum membro encontrado para "${searchTerm}"`
                : 'Nenhum membro cadastrado'}
            </Text>
            {searchTerm && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                <Text style={styles.clearSearchButtonText}>Limpar pesquisa</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        refreshing={loading}
        onRefresh={load}
        scrollEnabled={false}
      />
    </ScrollView>
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
  searchCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.surfaceElevated,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textTertiary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  searchResults: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  memberIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberIcon: {
    fontSize: 24,
  },
  actionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error + '15',
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clearSearchButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectedIndicatorText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
