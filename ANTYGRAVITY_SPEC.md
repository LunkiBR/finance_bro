# Spec para Antygravity — Bug Fixes UI/Frontend

## Contexto

Backend já configurado por mim (Claude Code):
- **NextAuth v5** configurado em `src/auth.ts` com credentials provider
- **`src/middleware.ts`** protege todas as rotas (exceto `/login` e `/api/auth/*`)
- **`src/app/page.tsx`** já redireciona: sem sessão → `/login`, sem onboarding → `/onboarding/welcome`, completo → `/copiloto`
- **`src/app/api/auth/[...nextauth]/route.ts`** handlers do NextAuth

Credenciais de acesso (`.env.local`):
- `APP_USERNAME=leo`
- `APP_PASSWORD=finance2026`

---

## T5 — Login Page

**Arquivo:** `src/app/login/page.tsx` (criar novo)

Implementar a página de login com:
- Marca "Finance Friend" (logo + nome)
- Form com campos: username (text) e password (password)
- Botão "Entrar"
- Mensagem de erro se credenciais inválidas
- Design dark consistente com o restante do app (ver `globals.css`)

**Lógica:**
```tsx
"use client"
import { signIn } from "next-auth/react"

// No submit:
const result = await signIn("credentials", {
  username,
  password,
  redirect: false,
})

if (result?.error) {
  // mostrar erro "Usuário ou senha incorretos"
} else {
  router.push("/") // middleware + page.tsx decidem o destino
}
```

**Importante:** NÃO usar `redirect: true` no signIn — tratar o erro manualmente antes de redirecionar.

---

## T6 — Dashboard Error Boundary + Null Guards

**Arquivo principal:** `src/app/(dashboard)/dashboard/page.tsx`

O dashboard crasha com "Application error" porque acessa propriedades de `data` quando `data === null` (antes do fetch completar).

**Fixes necessários:**

1. **Null guards no render:** Onde quer que use `data.xxx`, usar `data?.xxx` ou renderizar loading/empty states
2. **Error state:** Adicionar um estado `error: string | null` no component e mostrar UI de erro se o fetch falhar
3. **Error boundary:** Criar `src/app/(dashboard)/error.tsx` (Next.js App Router error boundary automático):
```tsx
"use client"
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Algo deu errado</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  )
}
```

---

## T7 — Sidebar com sessão real

**Arquivo:** `src/components/layout/sidebar.tsx`

Atualmente exibe "Leo" hardcoded. Trocar para usar a sessão do NextAuth.

**Dependência:** Precisa do `SessionProvider` no root layout (ver T9 abaixo).

**Mudança no sidebar:**
```tsx
"use client"
import { useSession } from "next-auth/react"

// No lugar do hardcoded "Leo":
const { data: session } = useSession()
const userName = session?.user?.name ?? "..."
const userInitial = userName.charAt(0).toUpperCase()
```

---

## T9 — SessionProvider no Root Layout (OBRIGATÓRIO para T7 funcionar)

**Arquivo:** `src/app/layout.tsx`

Adicionar o `SessionProvider` do NextAuth para que `useSession()` funcione em client components.

```tsx
import { SessionProvider } from "next-auth/react"
import { auth } from "@/auth"

// No layout:
const session = await auth()
return (
  <html lang="pt-BR" className="dark">
    <body>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </body>
  </html>
)
```

---

## Notas importantes

1. **NextAuth v5 beta** — API ligeiramente diferente do v4:
   - Import `signIn` de `"next-auth/react"` (client)
   - Import `auth` de `"@/auth"` (server)
   - Import `{ handlers }` de `"@/auth"` para as routes
   - `SessionProvider` vem de `"next-auth/react"`

2. **Onboarding pages** — já são acessíveis para usuários autenticados (middleware as permite). Não bloquear `/onboarding/*`.

3. **Signup desabilitado** — Não criar nenhuma rota de criação de conta. O acesso é somente via credenciais em env vars.

4. **Após onboarding** — O `src/app/api/onboarding/route.ts` já salva `onboardingCompleto: true`. Verificar se a página `src/app/onboarding/summary/page.tsx` redireciona para `/copiloto` após completar.

---

## Ordem de implementação sugerida

1. T9 (SessionProvider) — base para tudo
2. T5 (Login page) — visualmente mais importante
3. T6 (Dashboard error boundary) — resolve crash crítico
4. T7 (Sidebar sessão) — polish
