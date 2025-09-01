# Configurações Essenciais do Supabase para o Projeto BizManager

Este documento detalha as configurações necessárias no seu projeto Supabase para garantir o funcionamento correto e seguro do sistema BizManager.

## 1. Configuração das Variáveis de Ambiente

As variáveis de ambiente do Supabase já foram atualizadas no arquivo `.env` do projeto. Certifique-se de que as seguintes variáveis estejam configuradas corretamente no seu ambiente de produção:

```
NEXT_PUBLIC_SUPABASE_URL=https://<SEU_PROJETO_ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjxTRVVfUFJPSkVOVE9fSUQ+Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjEzMTEsImV4cCI6MjA2ODg5NzMxMX0.<SUA_CHAVE_ANONIMA>
```

**Substitua `<SEU_PROJETO_ID>` e `<SUA_CHAVE_ANONIMA>` pelos valores reais do seu projeto Supabase.**

## 2. Configurações de Autenticação (Dashboard do Supabase)

As configurações mais críticas para o funcionamento do registro e login de usuários são feitas diretamente no Dashboard do Supabase. Siga os passos abaixo:

1.  Acesse o **Dashboard do Supabase** do seu projeto.
2.  No menu lateral, navegue até **Authentication** (Autenticação).
3.  Clique em **Settings** (Configurações).

### 2.1. Provedores de Autenticação

Certifique-se de que o provedor de autenticação por **Email** esteja ativado.

### 2.2. Restrições de Domínio de E-mail (Email Sign-up / Allowed Email Domains)

Esta é a configuração mais importante para resolver o erro "Email address is invalid".

-   **Localização**: Dentro de `Authentication > Settings`, procure por seções como "Email Sign-up" ou "Allowed Email Domains".
-   **Ação Necessária**: Se houver uma lista de domínios permitidos, adicione `gmail.com` (ou qualquer outro domínio que você pretenda usar para registro de usuários) a essa lista. Se a opção for para restringir o registro apenas a domínios específicos, certifique-se de que os domínios desejados estejam incluídos. Se você estiver em ambiente de desenvolvimento e quiser desabilitar temporariamente essa restrição, procure por uma opção para desativá-la.

### 2.3. Configurações de SMTP (Envio de E-mails)

Para que o Supabase possa enviar e-mails de confirmação de registro, redefinição de senha, etc., você precisa configurar um servidor SMTP.

-   **Localização**: Dentro de `Authentication > Settings`, procure por "SMTP Settings" ou "Email Templates".
-   **Ação Necessária**: Configure os detalhes do seu servidor SMTP (Host, Port, Username, Password, Sender Email). Você pode usar serviços como SendGrid, Mailgun, Resend, ou seu próprio servidor SMTP.

## 3. Regras de Row Level Security (RLS)

As regras de RLS são definidas nos arquivos de migração SQL do seu projeto (`supabase/migrations/*.sql`). Elas controlam o acesso aos dados no seu banco de dados. O projeto atual já contém as regras RLS que foram consideradas adequadas. Se você precisar de modificações ou novas regras, por favor, defina os requisitos específicos.

**Exemplo de como verificar as políticas RLS no Dashboard:**

1.  No Dashboard do Supabase, navegue até **Database** (Banco de Dados).
2.  Clique em **Table Editor** (Editor de Tabelas).
3.  Selecione a tabela desejada (ex: `profiles`, `businesses`).
4.  Clique na aba **Policies** (Políticas) para ver as regras RLS aplicadas a essa tabela.

Ao seguir estas instruções, seu projeto BizManager estará configurado corretamente com o Supabase, permitindo o registro e login de usuários e garantindo a segurança do seu banco de dados.

