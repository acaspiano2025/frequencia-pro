# Guia de Deploy - Frequência Pro

## 🚀 Opção 1: Deploy Web na Vercel (Recomendado - Mais Fácil)

### Passo a Passo:

1. **Instalar Vercel CLI** (se ainda não tiver):
   ```bash
   npm install -g vercel
   ```

2. **Fazer login na Vercel**:
   ```bash
   vercel login
   ```
   - Vai abrir o navegador para você fazer login com GitHub/Google/Email

3. **No diretório do projeto, executar**:
   ```bash
   cd "C:\Users\dnascimento.ASFCORP\Downloads\aplicativo Mobile\frequencia-pro"
   vercel
   ```

4. **Seguir as perguntas**:
   - "Set up and deploy?" → **Y**
   - "Which scope?" → Escolha sua conta
   - "Link to existing project?" → **N** (primeira vez)
   - "What's your project's name?" → **frequencia-pro** (ou o nome que quiser)
   - "In which directory is your code located?" → **./** (pressione Enter)
   - "Want to override the settings?" → **N**

5. **Aguardar o deploy** - a Vercel vai:
   - Instalar dependências
   - Fazer build do app
   - Publicar na internet

6. **Você receberá uma URL pública** tipo:
   - `https://frequencia-pro.vercel.app`
   - Essa URL funciona em qualquer computador do mundo!

### Atualizar o app depois:
```bash
vercel --prod
```

---

## 📱 Opção 2: Deploy Mobile com Expo

### Para Android/iOS:

1. **Instalar EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Fazer login**:
   ```bash
   eas login
   ```

3. **Configurar o projeto**:
   ```bash
   eas build:configure
   ```

4. **Fazer build para Android**:
   ```bash
   eas build --platform android
   ```

5. **Ou para iOS**:
   ```bash
   eas build --platform ios
   ```

---

## 🌐 Opção 3: Deploy Web no Netlify

1. **Instalar Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Fazer login**:
   ```bash
   netlify login
   ```

3. **Fazer build local primeiro**:
   ```bash
   npm run build:web
   ```

4. **Deploy**:
   ```bash
   netlify deploy --prod --dir=web-build
   ```

---

## 🔗 Opção 4: Túnel Temporário (ngrok)

Para testar rapidamente sem fazer deploy permanente:

1. **Instalar ngrok**:
   - Baixe em: https://ngrok.com/download
   - Ou via npm: `npm install -g ngrok`

2. **Criar conta gratuita** em ngrok.com e pegar seu token

3. **Autenticar**:
   ```bash
   ngrok config add-authtoken SEU_TOKEN_AQUI
   ```

4. **Com o Expo rodando, em outro terminal**:
   ```bash
   ngrok http 8084
   ```

5. **Você receberá uma URL pública** tipo:
   - `https://abc123.ngrok.io`
   - Funciona temporariamente (gratuito tem limitações)

---

## ⚙️ Configurações Importantes

### Variáveis de Ambiente no Deploy:

No Supabase, você precisa atualizar as URLs de redirecionamento:

1. **Vercel/Netlify**: Adicione a URL pública do seu deploy
   - Exemplo: `https://frequencia-pro.vercel.app/auth/callback`

2. **Google Cloud Console**: Adicione também a URL pública
   - Exemplo: `https://frequencia-pro.vercel.app/auth/callback`

---

## 🎯 Recomendação

Para começar rápido, use a **Opção 1 (Vercel)** - é a mais simples e você terá seu app online em minutos!



