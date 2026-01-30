import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Job, User, Invoice, ClientNote, Quote } from "@/types";

const KEYS = {
  USER: "@user",
  CLIENTS: "@clients",
  JOBS: "@jobs",
  INVOICES: "@invoices",
  CLIENT_NOTES: "@client_notes",
  INVOICE_COUNTER: "@invoice_counter",
  QUOTES: "@quotes",
  QUOTE_COUNTER: "@quote_counter",
};

export const storage = {
  async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  async getClients(): Promise<Client[]> {
    const data = await AsyncStorage.getItem(KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },

  async saveClients(clients: Client[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },

  async addClient(client: Client): Promise<void> {
    const clients = await this.getClients();
    clients.push(client);
    await this.saveClients(clients);
  },

  async updateClient(updatedClient: Client): Promise<void> {
    const clients = await this.getClients();
    const index = clients.findIndex((c) => c.id === updatedClient.id);
    if (index !== -1) {
      clients[index] = updatedClient;
      await this.saveClients(clients);
    }
  },

  async deleteClient(clientId: string): Promise<void> {
    const clients = await this.getClients();
    const filtered = clients.filter((c) => c.id !== clientId);
    await this.saveClients(filtered);
    const jobs = await this.getJobs();
    const filteredJobs = jobs.filter((j) => j.clientId !== clientId);
    await this.saveJobs(filteredJobs);
    const invoices = await this.getInvoices();
    const filteredInvoices = invoices.filter((i) => i.clientId !== clientId);
    await this.saveInvoices(filteredInvoices);
    const notes = await this.getClientNotes();
    const filteredNotes = notes.filter((n) => n.clientId !== clientId);
    await this.saveClientNotes(filteredNotes);
  },

  async getJobs(): Promise<Job[]> {
    const data = await AsyncStorage.getItem(KEYS.JOBS);
    return data ? JSON.parse(data) : [];
  },

  async saveJobs(jobs: Job[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
  },

  async addJob(job: Job): Promise<void> {
    const jobs = await this.getJobs();
    jobs.push(job);
    await this.saveJobs(jobs);
  },

  async updateJob(updatedJob: Job): Promise<void> {
    const jobs = await this.getJobs();
    const index = jobs.findIndex((j) => j.id === updatedJob.id);
    if (index !== -1) {
      jobs[index] = updatedJob;
      await this.saveJobs(jobs);
    }
  },

  async deleteJob(jobId: string): Promise<void> {
    const jobs = await this.getJobs();
    const filtered = jobs.filter((j) => j.id !== jobId);
    await this.saveJobs(filtered);
  },

  async getInvoices(): Promise<Invoice[]> {
    const data = await AsyncStorage.getItem(KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },

  async saveInvoices(invoices: Invoice[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  },

  async addInvoice(invoice: Invoice): Promise<void> {
    const invoices = await this.getInvoices();
    invoices.push(invoice);
    await this.saveInvoices(invoices);
  },

  async updateInvoice(updatedInvoice: Invoice): Promise<void> {
    const invoices = await this.getInvoices();
    const index = invoices.findIndex((i) => i.id === updatedInvoice.id);
    if (index !== -1) {
      invoices[index] = updatedInvoice;
      await this.saveInvoices(invoices);
    }
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    const invoices = await this.getInvoices();
    const filtered = invoices.filter((i) => i.id !== invoiceId);
    await this.saveInvoices(filtered);
  },

  async getNextInvoiceNumber(): Promise<string> {
    const data = await AsyncStorage.getItem(KEYS.INVOICE_COUNTER);
    const counter = data ? parseInt(data, 10) : 0;
    const nextCounter = counter + 1;
    await AsyncStorage.setItem(KEYS.INVOICE_COUNTER, nextCounter.toString());
    return `INV-${nextCounter.toString().padStart(4, "0")}`;
  },

  async getClientNotes(): Promise<ClientNote[]> {
    const data = await AsyncStorage.getItem(KEYS.CLIENT_NOTES);
    return data ? JSON.parse(data) : [];
  },

  async saveClientNotes(notes: ClientNote[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CLIENT_NOTES, JSON.stringify(notes));
  },

  async addClientNote(note: ClientNote): Promise<void> {
    const notes = await this.getClientNotes();
    notes.push(note);
    await this.saveClientNotes(notes);
  },

  async deleteClientNote(noteId: string): Promise<void> {
    const notes = await this.getClientNotes();
    const filtered = notes.filter((n) => n.id !== noteId);
    await this.saveClientNotes(filtered);
  },

  async getQuotes(): Promise<Quote[]> {
    const data = await AsyncStorage.getItem(KEYS.QUOTES);
    return data ? JSON.parse(data) : [];
  },

  async saveQuotes(quotes: Quote[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
  },

  async addQuote(quote: Quote): Promise<void> {
    const quotes = await this.getQuotes();
    quotes.push(quote);
    await this.saveQuotes(quotes);
  },

  async updateQuote(updatedQuote: Quote): Promise<void> {
    const quotes = await this.getQuotes();
    const index = quotes.findIndex((q) => q.id === updatedQuote.id);
    if (index !== -1) {
      quotes[index] = updatedQuote;
      await this.saveQuotes(quotes);
    }
  },

  async deleteQuote(quoteId: string): Promise<void> {
    const quotes = await this.getQuotes();
    const filtered = quotes.filter((q) => q.id !== quoteId);
    await this.saveQuotes(filtered);
  },

  async getNextQuoteNumber(): Promise<string> {
    const data = await AsyncStorage.getItem(KEYS.QUOTE_COUNTER);
    const counter = data ? parseInt(data, 10) : 0;
    const nextCounter = counter + 1;
    await AsyncStorage.setItem(KEYS.QUOTE_COUNTER, nextCounter.toString());
    return `QTE-${nextCounter.toString().padStart(4, "0")}`;
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.USER,
      KEYS.CLIENTS,
      KEYS.JOBS,
      KEYS.INVOICES,
      KEYS.CLIENT_NOTES,
      KEYS.INVOICE_COUNTER,
      KEYS.QUOTES,
      KEYS.QUOTE_COUNTER,
    ]);
  },
};
