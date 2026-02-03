export type JobStatus = "not_started" | "in_progress" | "completed";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

export type PaymentTerms = "immediate" | "net7" | "net14" | "net30" | "net60";

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  immediate: "Immediate Payment",
  net7: "Net 7 Days",
  net14: "Net 14 Days",
  net30: "Net 30 Days",
  net60: "Net 60 Days",
};

export const PAYMENT_TERMS_DAYS: Record<PaymentTerms, number> = {
  immediate: 0,
  net7: 7,
  net14: 14,
  net30: 30,
  net60: 60,
};

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  notes?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: JobStatus;
  startDate?: string;
  dueDate?: string;
  laborHours?: number;
  laborRate?: number;
  materialsCost?: number;
  expenses?: Expense[];
  attachments?: Attachment[];
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface Attachment {
  id: string;
  uri: string;
  name: string;
  type: "image" | "document";
  size?: number;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  jobId?: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountPercent?: number;       // ✨ NEW
  discountAmount?: number;        // ✨ NEW
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paymentTerms?: PaymentTerms;    // ✨ NEW
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  createdAt: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  type: "note" | "call" | "email" | "meeting";
  createdAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  jobId?: string;
  status: QuoteStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountPercent?: number;       // ✨ NEW
  discountAmount?: number;        // ✨ NEW
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paymentTerms?: PaymentTerms;    // ✨ NEW
  issueDate: string;
  validUntil: string;
  sentDate?: string;
  respondedDate?: string;
  createdAt: string;
}

export interface User {
  pin: string;
  isAuthenticated: boolean;
}

// ✨ UPGRADED UserSettings - Full business details
export interface UserSettings {
  // Regional
  country: string;
  currency: string;
  locale: string;
  
  // Branding
  companyLogo?: string;
  logoSize?: number;
  companyName?: string;
  
  // ✨ NEW: Business Details
  businessAddress?: string;       // Street address
  businessCity?: string;          // City/Town
  businessPostcode?: string;      // Postcode/ZIP
  businessPhone?: string;         // Business phone
  businessEmail?: string;         // Business email
  vatNumber?: string;             // VAT/Tax registration number
  
  // ✨ NEW: Default settings
  defaultPaymentTerms?: PaymentTerms;  // Default payment terms for new invoices
}