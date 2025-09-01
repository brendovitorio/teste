import { z } from 'zod';

// Password validation with security requirements
const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha deve ter no máximo 128 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial');

// Email validation with additional security
const emailSchema = z.string()
  .email("Email inválido")
  .max(254, "Email muito longo");

// Auth schemas with improved security
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Business schemas with input sanitization
export const businessSchema = z.object({
  businessName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/, 'Nome contém caracteres inválidos'),
  subdomain: z.string()
    .min(3, 'Subdomínio deve ter pelo menos 3 caracteres')
    .max(20, 'Subdomínio deve ter no máximo 20 caracteres')
    .regex(/^[a-z0-9]+$/, 'Apenas letras minúsculas e números')
    .refine((subdomain) => {
      // Reserved subdomains
      const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'test', 'dev', 'staging'];
      return !reserved.includes(subdomain);
    }, 'Subdomínio reservado'),
  email: emailSchema,
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
});

// Payment schemas with enhanced validation
export const paymentSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'pix']),
  cardNumber: z.string()
    .regex(/^\d{13,19}$/, 'Número do cartão inválido')
    .optional(),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Data de expiração inválida (MM/AA)')
    .optional(),
  cvv: z.string()
    .regex(/^\d{3,4}$/, 'CVV inválido')
    .optional(),
  cardName: z.string()
    .min(2, 'Nome no cartão deve ter pelo menos 2 caracteres')
    .max(50, 'Nome no cartão muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome no cartão contém caracteres inválidos')
    .optional(),
}).refine((data) => {
  if (data.paymentMethod === 'credit_card') {
    return data.cardNumber && data.expiryDate && data.cvv && data.cardName;
  }
  return true;
}, {
  message: "Dados do cartão são obrigatórios",
});

// Employee schemas with input sanitization
export const employeeSchema = z.object({
  first_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome contém caracteres inválidos'),
  last_name: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Sobrenome contém caracteres inválidos'),
  email: emailSchema,
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  position: z.string()
    .min(2, 'Cargo deve ter pelo menos 2 caracteres')
    .max(100, 'Cargo deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/, 'Cargo contém caracteres inválidos'),
  hire_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de contratação inválida'),
  status: z.enum(['active', 'inactive']),
});

// Company schemas with input sanitization
export const companySchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/, 'Nome contém caracteres inválidos'),
  segment: z.string()
    .min(2, 'Segmento é obrigatório')
    .max(50, 'Segmento deve ter no máximo 50 caracteres'),
  employees_count: z.number()
    .min(0, 'Deve ser maior ou igual a 0')
    .max(10000, 'Número muito alto'),
  contact_phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  contact_email: emailSchema.optional().or(z.literal('')),
  address: z.string()
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive']),
});

// Service schemas with input sanitization
export const serviceSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/, 'Nome contém caracteres inválidos'),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  hourly_rate: z.number()
    .min(0, 'Deve ser maior ou igual a 0')
    .max(10000, 'Valor muito alto'),
  status: z.enum(['active', 'inactive']),
});

// Utility function to sanitize HTML input
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Utility function to validate and sanitize text input
export const sanitizeText = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;