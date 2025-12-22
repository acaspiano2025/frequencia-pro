import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import GoogleLogo from '../components/GoogleLogo';
import { signInWithGoogle, signInWithPassword, signOut } from '../services/auth';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await signInWithPassword(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha no logout');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha no login Google');
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
          <TextInput
            placeholder="E-mail"
            placeholderTextColor={colors.textTertiary}
            style={[
              commonStyles.input,
              focusedInput === 'email' && commonStyles.inputFocused,
            ]}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />
          <TextInput
            placeholder="Senha"
            placeholderTextColor={colors.textTertiary}
            style={[
              commonStyles.input,
              focusedInput === 'password' && commonStyles.inputFocused,
            ]}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
          />

          <TouchableOpacity
            style={[commonStyles.button, commonStyles.buttonPrimary, loading && commonStyles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[commonStyles.button, styles.buttonGoogle, loading && commonStyles.buttonDisabled]}
            onPress={handleGoogle}
            disabled={loading}
          >
            <View style={styles.googleButtonContent}>
              <GoogleLogo size={20} />
              <Text style={[commonStyles.buttonText, { color: colors.textPrimary }]}>
                Continuar com Google
              </Text>
            </View>
          </TouchableOpacity>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
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
});
