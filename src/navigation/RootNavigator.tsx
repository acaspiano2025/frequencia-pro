import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import { supabase } from '../lib/supabase';
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
    
    // Processar callback do OAuth no web
    if (Platform.OS === 'web') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Limpar hash da URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // O Supabase já processa automaticamente, mas vamos garantir
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(() => {
          if (mounted) {
            supabase.auth.getSession().then(({ data }) => {
              if (mounted) {
                setSession(data.session);
                setLoading(false);
              }
            });
          }
        });
        return;
      }
    }
    
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });
    
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
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

