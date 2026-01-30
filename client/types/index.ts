export type JobStatus = "not_started" | "in_progress" | "completed";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

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
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
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
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
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

export interface UserSettings {
  country: string;
  currency: string;
  locale: string;
  companyLogo?: string;
  logoSize?: number;
  companyName?: string;
}
