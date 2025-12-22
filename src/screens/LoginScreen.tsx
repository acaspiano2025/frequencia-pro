import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import GoogleLogo from '../components/GoogleLogo';
import { signInWithGoogle } from '../services/auth';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const errorMessage = err.message ?? 'Falha no login Google';
      Alert.alert(
        errorMessage.includes('não autorizado') ? 'Acesso Negado' : 'Erro',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>📊</Text>
          </View>
          <Text style={styles.title}>Frequência Pro</Text>
          <Text style={styles.subtitle}>Controle inteligente de presença</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[commonStyles.button, styles.buttonGoogle, loading && commonStyles.buttonDisabled]}
            onPress={handleGoogle}
            disabled={loading}
          >
            <View style={styles.googleButtonContent}>
              <GoogleLogo size={20} />
              <Text style={[commonStyles.buttonText, { color: colors.textPrimary }]}>
                {loading ? 'Entrando...' : 'Entrar com Google'}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Apenas usuários com Gmail cadastrado no sistema podem fazer login.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  buttonGoogle: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowOpacity: 0.05,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    marginTop: 24,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
