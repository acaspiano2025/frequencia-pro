# 🚀 Template Rápido - Novo Projeto Mobile

## ⚡ Setup Inicial (5 comandos)

```bash
# 1. Criar projeto
npx create-expo-app meu-projeto --template blank-typescript
cd meu-projeto

# 2. Instalar dependências básicas
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context @supabase/supabase-js expo-secure-store expo-auth-session expo-web-browser react-dom react-native-web react-native-gesture-handler

# 3. Criar estrutura de pastas
mkdir -p src/{components,domain,lib,navigation,screens,services,theme}

# 4. Iniciar desenvolvimento
npm start
```

---

## 📁 Estrutura Mínima de Arquivos

```
projeto/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Cliente Supabase
│   ├── services/
│   │   ├── auth.ts              # Autenticação
│   │   └── supabaseRepo.ts      # CRUD
│   ├── domain/
│   │   ├── types.ts             # Interfaces
│   │   └── business.ts          # Lógica
│   ├── theme/
│   │   ├── colors.ts            # Cores
│   │   └── styles.ts            # Estilos
│   ├── navigation/
│   │   └── RootNavigator.tsx    # Navegação
│   └── screens/
│       ├── LoginScreen.tsx
│       └── HomeScreen.tsx
├── App.tsx
└── package.json
```

---

## 🔧 Configurações Essenciais

### 1. Supabase Client (src/lib/supabase.ts)
```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = 'SUA_URL';
const supabaseAnonKey = 'SUA_CHAVE';

const storage = {
  getItem: async (key: string) => 
    Platform.OS === 'web' ? localStorage.getItem(key) : await SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => 
    Platform.OS === 'web' ? localStorage.setItem(key, value) : await SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => 
    Platform.OS === 'web' ? localStorage.removeItem(key) : await SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage, autoRefreshToken: true, persistSession: true },
});
```

### 2. Navegação (src/navigation/RootNavigator.tsx)
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  return (
    <NavigationContainer>
      {session ? (
        <Tab.Navigator>
          <Tab.Screen name="Home" component={HomeScreen} />
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

### 3. App.tsx
```typescript
import 'react-native-gesture-handler';
import { WebBrowser } from 'expo-web-browser';
import RootNavigator from './src/navigation/RootNavigator';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return <RootNavigator />;
}
```

---

## 🗄️ SQL Básico para Supabase

```sql
-- Criar tabela
CREATE TABLE IF NOT EXISTS minha_tabela (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE minha_tabela ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view" ON minha_tabela 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert" ON minha_tabela 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update" ON minha_tabela 
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete" ON minha_tabela 
  FOR DELETE USING (auth.role() = 'authenticated');
```

---

## 📱 CRUD Básico

```typescript
// src/services/supabaseRepo.ts
import { supabase } from '../lib/supabase';

export async function fetchAll() {
  const { data, error } = await supabase.from('minha_tabela').select('*');
  if (error) throw error;
  return data;
}

export async function add(payload: { nome: string }) {
  const { error } = await supabase.from('minha_tabela').insert(payload);
  if (error) throw error;
}

export async function update(id: string, payload: { nome?: string }) {
  const { error } = await supabase
    .from('minha_tabela')
    .update(payload)
    .eq('id', id);
  if (error) throw error;
}

export async function remove(id: string) {
  const { error } = await supabase.from('minha_tabela').delete().eq('id', id);
  if (error) throw error;
}
```

---

## 🎨 Tema Básico

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  border: '#E5E5EA',
};

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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## 🚀 Deploy Vercel

```bash
# 1. Criar vercel.json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist"
}

# 2. Deploy
vercel login
vercel --prod
```

---

## ✅ Checklist Rápido

- [ ] Projeto criado
- [ ] Dependências instaladas
- [ ] Estrutura de pastas criada
- [ ] Supabase configurado
- [ ] Tabelas criadas
- [ ] Navegação funcionando
- [ ] Autenticação funcionando
- [ ] CRUD funcionando
- [ ] Deploy realizado

---

**Para mais detalhes, consulte: `GUIA_COMPLETO_DESENVOLVIMENTO.md`**



