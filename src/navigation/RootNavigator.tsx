import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import { supabase } from '../lib/supabase';
import { validateUserEmail } from '../services/auth';
import { colors } from '../theme/colors';
import AttendanceScreen from '../screens/AttendanceScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LoginScreen from '../screens/LoginScreen';
import MeetingsScreen from '../screens/MeetingsScreen';
import MembersScreen from '../screens/MembersScreen';
import ReportsScreen from '../screens/ReportsScreen';

enableScreens();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '🏠' : '🏡'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Agendamentos"
        component={MeetingsScreen}
        options={{
          title: 'Reuniões',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '📅' : '📆'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Frequencia"
        component={AttendanceScreen}
        options={{
          title: 'Frequência',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '✅' : '☑️'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Membros"
        component={MembersScreen}
        options={{
          title: 'Membros',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '👥' : '👤'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Relatorios"
        component={ReportsScreen}
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '📊' : '📈'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let validationInProgress = false;
    
    // Timeout de segurança para garantir que loading sempre termine (3 segundos)
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Timeout de carregamento - forçando exibição da tela');
        setLoading(false);
        // Se não há sessão após timeout, mostrar login
        if (!session) {
          setSession(null);
        }
      }
    }, 3000); // 3 segundos (reduzido para carregar mais rápido)
    
    // Função para validar e processar sessão
    const validateAndSetSession = async (session: any) => {
      if (!mounted || !session?.user?.email) {
        return session;
      }
      
      // Evitar validações duplicadas
      if (validationInProgress) {
        return session;
      }
      
      try {
        validationInProgress = true;
        
        // Timeout para evitar travamento (5 segundos)
        const validationPromise = validateUserEmail(session.user.email);
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 5000);
        });
        
        const isValid = await Promise.race([validationPromise, timeoutPromise]);
        
        // Se a validação retornar false (email não cadastrado)
        if (!isValid) {
          await supabase.auth.signOut();
          if (Platform.OS === 'web') {
            // No web, redirecionar para login após mostrar mensagem
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            Alert.alert(
              'Acesso Negado',
              'Acesso não autorizado. Entre em contato com o administrador.',
              [{ text: 'OK' }]
            );
          }
          return null;
        }
        
        return session;
      } catch (error) {
        console.error('Erro ao validar email:', error);
        // Se houver erro na validação (ex: tabela não existe), permitir acesso temporariamente
        // para não bloquear o sistema
        console.warn('Permitindo acesso temporário devido a erro na validação');
        return session;
      } finally {
        validationInProgress = false;
      }
    };
    
    // Processar callback do OAuth no web
    if (Platform.OS === 'web') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Limpar hash da URL imediatamente
        window.history.replaceState(null, '', '/');
        
        // O Supabase processa automaticamente com detectSessionInUrl
        // Mas vamos garantir que a sessão seja definida
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(async () => {
          if (mounted) {
            const { data } = await supabase.auth.getSession();
            if (mounted && data.session) {
              const validatedSession = await validateAndSetSession(data.session);
              setSession(validatedSession);
            }
            setLoading(false);
          }
        }).catch((error) => {
          console.error('Erro ao processar callback:', error);
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
        });
        return;
      }
    }
    
    // Carregar sessão inicial - apenas se houver hash de callback OAuth ou localStorage
    // Isso evita chamadas automáticas desnecessárias ao Supabase
    const loadInitialSession = async () => {
      try {
        // No web, verificar primeiro se há callback OAuth antes de chamar Supabase
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Se não há callback e não há token salvo, pular a verificação inicial
          const hasHash = window.location.hash.includes('access_token');
          const hasToken = typeof localStorage !== 'undefined' 
            ? localStorage.getItem('sb-lpwsggnkwbyyjcytuiwh-auth-token') 
            : null;
          
          if (!hasHash && !hasToken) {
            // Não há sessão prévia, mostrar login diretamente
            console.log('🚀 Nenhuma sessão prévia encontrada - mostrando tela de login');
            setSession(null);
            setLoading(false);
            return;
          }
        }
        
        // Carregar sessão apenas se houver indicativo de sessão
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (data.session) {
          // Primeiro, mostrar a sessão sem validação para não travar o carregamento
          setSession(data.session);
          setLoading(false);
          
          // Validar em background (sem bloquear a UI)
          validateAndSetSession(data.session).then((validatedSession) => {
            if (mounted) {
              if (validatedSession) {
                console.log('✅ Sessão validada com sucesso');
                setSession(validatedSession);
              } else {
                console.warn('⚠️ Validação falhou - removendo sessão');
                // Se a validação falhar, fazer logout
                supabase.auth.signOut();
                setSession(null);
                if (Platform.OS === 'web') {
                  setTimeout(() => {
                    Alert.alert(
                      'Acesso Negado',
                      'Acesso não autorizado. Entre em contato com o administrador.',
                      [{ text: 'OK' }]
                    );
                  }, 500);
                }
              }
            }
          }).catch((error) => {
            console.error('❌ Erro na validação em background:', error);
            // Em caso de erro, manter a sessão por enquanto (pode ser problema temporário)
            console.warn('⚠️ Mantendo sessão devido a erro na validação');
          });
        } else {
          setSession(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    };
    
    loadInitialSession();
    
    // Escutar mudanças na autenticação
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      
      if (newSession) {
        const validatedSession = await validateAndSetSession(newSession);
        setSession(validatedSession);
      } else {
        setSession(null);
      }
    });
    
    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary, fontSize: 14 }}>
          Carregando...
        </Text>
      </View>
    );
  }

  const isAuthed = !!session;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthed ? (
        <Stack.Screen name="AppTabs" component={AppTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

