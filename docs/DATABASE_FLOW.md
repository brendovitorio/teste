# 📊 Fluxo do Banco de Dados - Compra de Plano

## 🎯 Cenário: Cliente "João" compra plano Profissional para Oficina

### **1. Estado Inicial (Dados já existem)**

```sql
-- Segmentos disponíveis
business_segments:
├── Oficina Mecânica (oficina)
├── Pet Shop (petshop)  
├── Salão de Beleza (salao)
└── ... (8 segmentos total)

-- Planos por segmento
subscription_plans:
├── Básico (R$ 99,90)
├── Profissional (R$ 199,90) ← ESCOLHIDO
└── Avançado (R$ 399,90)
```

### **2. Fluxo de Compra**

#### **Passo 1: Cliente escolhe plano**
- Segmento: `Oficina Mecânica`
- Plano: `Profissional (R$ 199,90)`
- Trial: `14 dias grátis`

#### **Passo 2: Checkout**
```sql
-- Dados preenchidos:
business_name: "Oficina do João"
subdomain: "oficina-do-joao" (verificado como disponível)
email: "joao@oficina.com"
payment_method: "credit_card"
```

#### **Passo 3: Pagamento processado**
```sql
-- Webhook recebido do Stripe/Mercado Pago
payment_id: "pi_1234567890"
status: "succeeded"
amount: 199.90
```

### **3. Criação Automática no Banco**

#### **A) Assinatura criada:**
```sql
user_subscriptions:
├── id: uuid-subscription
├── user_id: uuid-joao
├── plan_id: uuid-plan-profissional
├── status: "trial" (14 dias grátis)
├── payment_method: "credit_card"
├── trial_ends_at: "2025-01-29"
├── expires_at: "2025-02-15"
└── auto_renew: true
```

#### **B) Tenant (negócio) criado:**
```sql
business_tenants:
├── id: uuid-tenant
├── subscription_id: uuid-subscription
├── owner_id: uuid-joao
├── business_name: "Oficina do João"
├── subdomain: "oficina-do-joao"
├── segment_id: uuid-oficina
├── custom_domain: null (pode configurar depois)
├── brand_colors: {"primary": "#3B82F6"}
└── status: "active"
```

#### **C) Usuário owner adicionado:**
```sql
tenant_users:
├── id: uuid-tenant-user
├── tenant_id: uuid-tenant
├── user_id: uuid-joao
├── role: "owner"
├── permissions: {"all": true}
├── status: "active"
└── joined_at: "2025-01-15"
```

#### **D) Webhook registrado:**
```sql
payment_webhooks:
├── subscription_id: uuid-subscription
├── provider: "stripe"
├── event_type: "payment_intent.succeeded"
├── payment_id: "pi_1234567890"
├── status: "succeeded"
├── amount: 199.90
└── processed: true
```

#### **E) Log de atividade:**
```sql
activity_logs:
├── tenant_id: uuid-tenant
├── user_id: uuid-joao
├── action: "tenant_created"
├── resource_type: "business_tenant"
├── details: {"plan": "profissional", "segment": "oficina"}
└── ip_address: "192.168.1.100"
```

### **4. Resultado Final**

#### **🌐 Acessos disponíveis:**
- **Subdomínio:** `oficina-do-joao.sistemax.com`
- **Dashboard:** Específico para oficinas mecânicas
- **Usuários:** Até 10 (limite do plano Profissional)
- **Trial:** 14 dias grátis, depois R$ 199,90/mês

#### **🔐 Permissões:**
- **João (Owner):** Acesso total ao sistema
- **Pode convidar:** Até 9 funcionários
- **Roles disponíveis:** Admin, Manager, Employee

#### **⚙️ Funcionalidades liberadas:**
- ✅ Dashboard de oficina mecânica
- ✅ Gestão de OS (Ordens de Serviço)
- ✅ Controle de estoque
- ✅ Relatórios avançados
- ✅ Integração WhatsApp
- ✅ App mobile
- ✅ Suporte prioritário

### **5. Próximos Passos Automáticos**

#### **Durante o Trial (14 dias):**
- Sistema monitora uso
- Envia emails de onboarding
- Notifica sobre fim do trial

#### **Após Trial:**
- Cobrança automática (R$ 199,90)
- Se pagamento falhar: status → "expired"
- Se pagar: status → "active"

#### **Renovação Mensal:**
- Cobrança automática todo dia 15
- Webhook confirma pagamento
- Sistema mantém acesso ativo

### **6. Isolamento Multi-Tenant**

Cada consulta no sistema inclui `tenant_id`:

```sql
-- Exemplo: Buscar funcionários da Oficina do João
SELECT * FROM employees 
WHERE tenant_id = 'uuid-tenant-oficina-joao'
AND status = 'active';

-- RLS garante isolamento automático
-- João só vê dados da SUA oficina
```

### **7. Escalabilidade**

O sistema suporta:
- **Milhares de tenants** simultâneos
- **Isolamento completo** entre clientes
- **Domínios personalizados** (plano Avançado)
- **Backup automático** por tenant
- **Métricas individuais** por negócio

---

## 🎉 **Resultado: Sistema 100% Funcional**

Após a compra, João tem:
- ✅ Painel exclusivo da oficina
- ✅ Subdomínio personalizado  
- ✅ 14 dias grátis para testar
- ✅ Todas as funcionalidades do plano
- ✅ Suporte prioritário
- ✅ Dados 100% isolados e seguros