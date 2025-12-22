# 📱 Guia Completo de Desenvolvimento Mobile - Expo/React Native + Supabase

Este guia documenta todo o processo de criação do aplicativo **Frequência Pro**, servindo como referência para futuros projetos mobile.

---

## 📋 Índice

1. [Pré-requisitos e Instalação](#1-pré-requisitos-e-instalação)
2. [Criação do Projeto](#2-criação-do-projeto)
3. [Configuração do Supabase](#3-configuração-do-supabase)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Configuração de Navegação](#5-configuração-de-navegação)
6. [Sistema de Autenticação](#6-sistema-de-autenticação)
7. [Criação de Telas](#7-criação-de-telas)
8. [Lógica de Negócio](#8-lógica-de-negócio)
9. [Estilização e Tema](#9-estilização-e-tema)
10. [Integração com Banco de Dados](#10-integração-com-banco-de-dados)
11. [Deploy Web (Vercel)](#11-deploy-web-vercel)
12. [Checklist Final](#12-checklist-final)

---

## 1. Pré-requisitos e Instalação

### 1.1 Instalar Node.js
1. Baixe o Node.js em: https://nodejs.org/
2. Instale a versão LTS (Long Term Support)
3. Verifique a instalação:
   ```bash
   node --version
   npm --version
   ```

### 1.2 Instalar Expo CLI
```bash
npm install -g expo-cli
```

### 1.3 Instalar Vercel CLI (para deploy)
```bash
npm install -g vercel
```

---

## 2. Criação do Projeto

### 2.1 Criar Projeto Expo
```bash
npx create-expo-app nome-do-projeto --template blank-typescript
cd nome-do-projeto
```

### 2.2 Instalar Dependências Básicas
```bash
# Navegação
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Supabase
npm install @supabase/supabase-js

# Autenticação
npx expo install expo-secure-store expo-auth-session expo-web-browser

# Web (para deploy)
npx expo install react-dom react-native-web react-native-gesture-handler react-native-svg

# Outras
npm install --save-dev @types/react
```

### 2.3 Configurar package.json
Adicione os scripts necessários:
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:web": "expo export --platform web"
  }
}
```

---

## 3. Configuração do Supabase

### 3.1 Criar Projeto no Supabase
1. Acesse: https://supabase.com/
2. Crie uma conta (se não tiver)
3. Clique em "New Project"
4. Preencha:
   - **Name**: Nome do projeto
   - **Database Password**: Senha forte (anote!)
   - **Region**: Escolha a região mais próxima
5. Aguarde a criação (2-3 minutos)

### 3.2 Obter Credenciais
1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (chave pública)

### 3.3 Configurar Autenticação
1. Vá em **Authentication** → **Providers**
2. Habilite **Email** (já vem habilitado)
3. Para Google OAuth:
   - Habilite **Google**
   - Configure no Google Cloud Console:
     - Crie projeto em: https://console.cloud.google.com/
     - Ative Google+ API
     - Crie credenciais OAuth 2.0
     - Adicione redirect URI: `https://seu-projeto.supabase.co/auth/v1/callback`
   - Cole **Client ID** e **Client Secret** no Supabase

### 3.4 Criar Tabelas no Banco
1. Vá em **SQL Editor**
2. Crie um novo arquivo SQL com o schema das tabelas
3. Execute o script (veja exemplo em `supabase-schema.sql`)

**Estrutura básica de tabela:**
```sql
CREATE TABLE IF NOT EXISTS nome_tabela (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campo1 TEXT NOT NULL,
  campo2 INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view" ON nome_tabela 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert" ON nome_tabela 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- ... outras políticas
```

---

## 4. Estrutura de Pastas

Crie a seguinte estrutura:

```
projeto/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   ├── domain/             # Lógica de negócio e tipos
│   │   ├── types.ts        # Interfaces TypeScript
│   │   └── business.ts    # Funções de lógica
│   ├── lib/                # Configurações
│   │   └── supabase.ts     # Cliente Supabase
│   ├── navigation/         # Configuração de navegação
│   │   └── RootNavigator.tsx
│   ├── screens/            # Telas do app
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   └── ...
│   ├── services/           # Serviços e APIs
│   │   ├── auth.ts         # Autenticação
│   │   └── supabaseRepo.ts # Repositório de dados
│   └── theme/              # Tema e estilos
│       ├── colors.ts
│       └── styles.ts
├── App.tsx                 # Componente raiz
├── app.json                # Configuração Expo
├── package.json
└── tsconfig.json
```

---

## 5. Configuração de Navegação

### 5.1 Criar RootNavigator.tsx
```typescript
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
// ... outras telas

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {session ? (
        <Tab.Navigator>
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          {/* outras tabs */}
        </Tab.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
```

### 5.2 Atualizar App.tsx
```typescript
// App.tsx
import 'react-native-gesture-handler';
import { WebBrowser } from 'expo-web-browser';
import RootNavigator from './src/navigation/RootNavigator';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return <RootNavigator />;
}
```

---

## 6. Sistema de Autenticação

### 6.1 Configurar Supabase Client
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = 'SUA_URL_AQUI';
const supabaseAnonKey = 'SUA_CHAVE_AQUI';

// Adapter para armazenamento seguro
const secureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### 6.2 Criar Serviço de Autenticação
```typescript
// src/services/auth.ts
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'frequencia-pro', // ou use expo proxy
    useProxy: true,
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (data.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
```

---

## 7. Criação de Telas

### 7.1 Estrutura Básica de uma Tela
```typescript
// src/screens/ExampleScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { commonStyles } from '../theme/styles';
import { colors } from '../theme/colors';

export default function ExampleScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar dados
      const result = await fetchData();
      setData(result);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Título</Text>
      <Text style={commonStyles.caption}>Descrição</Text>
      
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={commonStyles.card}>
            <Text>{item.name}</Text>
          </View>
        )}
        refreshing={loading}
        onRefresh={loadData}
      />
    </View>
  );
}
```

### 7.2 Tela de Login
```typescript
// src/screens/LoginScreen.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmail, signInWithGoogle } from '../services/auth';
import { commonStyles } from '../theme/styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e senha');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Login</Text>
      
      <TextInput
        placeholder="Email"
        style={commonStyles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Senha"
        style={commonStyles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={[commonStyles.button, commonStyles.buttonPrimary]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={commonStyles.buttonText}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[commonStyles.button, commonStyles.buttonSecondary]}
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <Text style={commonStyles.buttonText}>Entrar com Google</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 8. Lógica de Negócio

### 8.1 Definir Tipos TypeScript
```typescript
// src/domain/types.ts
export interface Entity {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING';
```

### 8.2 Criar Funções de Lógica
```typescript
// src/domain/business.ts
import { Entity } from './types';

export function calculateSomething(data: Entity[]): number {
  return data.reduce((acc, item) => acc + item.value, 0);
}

export function filterByStatus(
  data: Entity[],
  status: Status
): Entity[] {
  return data.filter((item) => item.status === status);
}
```

---

## 9. Estilização e Tema

### 9.1 Definir Cores
```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  surfaceElevated: '#FFFFFF',
  border: '#E5E5EA',
};
```

### 9.2 Criar Estilos Comuns
```typescript
// src/theme/styles.ts
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  caption: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // ... mais estilos
});
```

---

## 10. Integração com Banco de Dados

### 10.1 Criar Repositório
```typescript
// src/services/supabaseRepo.ts
import { supabase } from '../lib/supabase';
import { Entity } from '../domain/types';

const handle = <T>(result: { data: T | null; error: any }) => {
  if (result.error) throw result.error;
  return result.data as T;
};

export async function fetchEntities(): Promise<Entity[]> {
  const res = await supabase
    .from('entities')
    .select('*')
    .order('created_at', { ascending: false });
  return handle(res).map((row: any) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function addEntity(payload: { name: string }) {
  const res = await supabase.from('entities').insert({
    name: payload.name,
  });
  handle(res);
}

export async function updateEntity(id: string, payload: { name?: string }) {
  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  
  const res = await supabase
    .from('entities')
    .update(updateData)
    .eq('id', id);
  handle(res);
}

export async function deleteEntity(id: string) {
  const res = await supabase.from('entities').delete().eq('id', id);
  handle(res);
}
```

---

## 11. Deploy Web (Vercel)

### 11.1 Configurar Vercel
1. Instale Vercel CLI (se ainda não tiver):
   ```bash
   npm install -g vercel
   ```

2. Crie `vercel.json`:
   ```json
   {
     "buildCommand": "npm run build:web",
     "outputDirectory": "dist",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. Crie `.vercelignore`:
   ```
   node_modules
   .expo
   .git
   ```

### 11.2 Fazer Deploy
```bash
# Login no Vercel
vercel login

# Deploy (primeira vez)
vercel

# Deploy em produção
vercel --prod
```

### 11.3 Atualizar URLs de Redirect
Após o deploy, atualize as URLs de redirect:
- **Supabase**: Settings → Authentication → URL Configuration
- **Google Cloud Console**: Credenciais OAuth → Redirect URIs

---

## 12. Checklist Final

### Configuração Inicial
- [ ] Node.js instalado
- [ ] Projeto Expo criado
- [ ] Dependências instaladas
- [ ] Estrutura de pastas criada

### Supabase
- [ ] Projeto criado no Supabase
- [ ] Credenciais obtidas (URL e anon key)
- [ ] Tabelas criadas (SQL executado)
- [ ] RLS (Row Level Security) configurado
- [ ] Autenticação configurada (Email + Google)

### Aplicativo
- [ ] Navegação configurada
- [ ] Tela de login funcionando
- [ ] Autenticação funcionando (Email + Google)
- [ ] Telas principais criadas
- [ ] Integração com banco funcionando
- [ ] Estilização aplicada
- [ ] Testes realizados

### Deploy
- [ ] Vercel configurado
- [ ] Deploy realizado
- [ ] URLs de redirect atualizadas
- [ ] App funcionando online

---

## 📚 Recursos Adicionais

### Documentação Oficial
- **Expo**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs

### Comandos Úteis
```bash
# Iniciar desenvolvimento
npm start

# Executar em plataforma específica
npm run android
npm run ios
npm run web

# Build para produção
npm run build:web

# Verificar tipos TypeScript
npx tsc --noEmit
```

---

## 🎯 Próximos Passos para Novos Projetos

1. **Copie este guia** como template
2. **Ajuste os nomes** (projeto, tabelas, telas)
3. **Adapte a lógica de negócio** conforme necessário
4. **Personalize o tema** (cores, estilos)
5. **Adicione funcionalidades específicas** do seu projeto

---

## 💡 Dicas Importantes

1. **Sempre use TypeScript** para type safety
2. **Organize o código** em pastas lógicas
3. **Reutilize componentes** e estilos
4. **Teste em diferentes plataformas** (web, Android, iOS)
5. **Documente funções complexas**
6. **Use Git** para versionamento
7. **Mantenha as dependências atualizadas**

---

**Boa sorte com seus próximos projetos! 🚀**



