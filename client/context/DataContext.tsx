import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/lib/storage";
import { Client, Job, JobStatus, Invoice, InvoiceStatus, ClientNote, Quote, QuoteStatus } from "@/types";

interface DataContextType {
  clients: Client[];
  jobs: Job[];
  invoices: Invoice[];
  quotes: Quote[];
  clientNotes: ClientNote[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  addJob: (job: Omit<Job, "id" | "createdAt">) => Promise<Job>;
  updateJob: (job: Job) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">) => Promise<Invoice>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  addQuote: (quote: Omit<Quote, "id" | "createdAt" | "quoteNumber">) => Promise<Quote>;
  updateQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (quoteId: string) => Promise<void>;
  addClientNote: (note: Omit<ClientNote, "id" | "createdAt">) => Promise<ClientNote>;
  deleteClientNote: (noteId: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
  getJobById: (id: string) => Job | undefined;
  getInvoiceById: (id: string) => Invoice | undefined;
  getQuoteById: (id: string) => Quote | undefined;
  getJobsForClient: (clientId: string) => Job[];
  getInvoicesForClient: (clientId: string) => Invoice[];
  getInvoicesForJob: (jobId: string) => Invoice[];
  getQuotesForClient: (clientId: string) => Quote[];
  getQuotesForJob: (jobId: string) => Quote[];
  getNotesForClient: (clientId: string) => ClientNote[];
  getActiveJobs: () => Job[];
  getJobCountForClient: (clientId: string) => number;
  getTotalRevenue: () => number;
  getPendingRevenue: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedClients, loadedJobs, loadedInvoices, loadedQuotes, loadedNotes] = await Promise.all([
        storage.getClients(),
        storage.getJobs(),
        storage.getInvoices(),
        storage.getQuotes(),
        storage.getClientNotes(),
      ]);
      setClients(loadedClients);
      setJobs(loadedJobs);
      setInvoices(loadedInvoices);
      setQuotes(loadedQuotes);
      setClientNotes(loadedNotes);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addClient = async (clientData: Omit<Client, "id" | "createdAt">): Promise<Client> => {
    const newClient: Client = {
      ...clientData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await storage.addClient(newClient);
    setClients((prev) => [...prev, newClient]);
    return newClient;
  };

  const updateClient = async (client: Client) => {
    await storage.updateClient(client);
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
  };

  const deleteClient = async (clientId: string) => {
    await storage.deleteClient(clientId);
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setJobs((prev) => prev.filter((j) => j.clientId !== clientId));
    setInvoices((prev) => prev.filter((i) => i.clientId !== clientId));
    setClientNotes((prev) => prev.filter((n) => n.clientId !== clientId));
  };

  const addJob = async (jobData: Omit<Job, "id" | "createdAt">): Promise<Job> => {
    const newJob: Job = {
      ...jobData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await storage.addJob(newJob);
    setJobs((prev) => [...prev, newJob]);
    return newJob;
  };

  const updateJob = async (job: Job) => {
    await storage.updateJob(job);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
  };

  const deleteJob = async (jobId: string) => {
    await storage.deleteJob(jobId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">): Promise<Invoice> => {
    const invoiceNumber = await storage.getNextInvoiceNumber();
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId(),
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    await storage.addInvoice(newInvoice);
    setInvoices((prev) => [...prev, newInvoice]);
    return newInvoice;
  };

  const updateInvoice = async (invoice: Invoice) => {
    await storage.updateInvoice(invoice);
    setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? invoice : i)));
  };

  const deleteInvoice = async (invoiceId: string) => {
    await storage.deleteInvoice(invoiceId);
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  };

  const addQuote = async (quoteData: Omit<Quote, "id" | "createdAt" | "quoteNumber">): Promise<Quote> => {
    const quoteNumber = await storage.getNextQuoteNumber();
    const newQuote: Quote = {
      ...quoteData,
      id: generateId(),
      quoteNumber,
      createdAt: new Date().toISOString(),
    };
    await storage.addQuote(newQuote);
    setQuotes((prev) => [...prev, newQuote]);
    return newQuote;
  };

  const updateQuote = async (quote: Quote) => {
    await storage.updateQuote(quote);
    setQuotes((prev) => prev.map((q) => (q.id === quote.id ? quote : q)));
  };

  const deleteQuote = async (quoteId: string) => {
    await storage.deleteQuote(quoteId);
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
  };

  const addClientNote = async (noteData: Omit<ClientNote, "id" | "createdAt">): Promise<ClientNote> => {
    const newNote: ClientNote = {
      ...noteData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await storage.addClientNote(newNote);
    setClientNotes((prev) => [...prev, newNote]);
    return newNote;
  };

  const deleteClientNote = async (noteId: string) => {
    await storage.deleteClientNote(noteId);
    setClientNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);
  const getJobById = (id: string) => jobs.find((j) => j.id === id);
  const getInvoiceById = (id: string) => invoices.find((i) => i.id === id);
  const getQuoteById = (id: string) => quotes.find((q) => q.id === id);
  const getJobsForClient = (clientId: string) => jobs.filter((j) => j.clientId === clientId);
  const getInvoicesForClient = (clientId: string) => invoices.filter((i) => i.clientId === clientId);
  const getInvoicesForJob = (jobId: string) => invoices.filter((i) => i.jobId === jobId);
  const getQuotesForClient = (clientId: string) => quotes.filter((q) => q.clientId === clientId);
  const getQuotesForJob = (jobId: string) => quotes.filter((q) => q.jobId === jobId);
  const getNotesForClient = (clientId: string) => 
    clientNotes.filter((n) => n.clientId === clientId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  const getActiveJobs = () => jobs.filter((j) => j.status !== "completed");
  const getJobCountForClient = (clientId: string) => jobs.filter((j) => j.clientId === clientId).length;

  const getTotalRevenue = () => 
    invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0);

  const getPendingRevenue = () => 
    invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((sum, i) => sum + i.total, 0);

  return (
    <DataContext.Provider
      value={{
        clients,
        jobs,
        invoices,
        quotes,
        clientNotes,
        isLoading,
        refreshData,
        addClient,
        updateClient,
        deleteClient,
        addJob,
        updateJob,
        deleteJob,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addQuote,
        updateQuote,
        deleteQuote,
        addClientNote,
        deleteClientNote,
        getClientById,
        getJobById,
        getInvoiceById,
        getQuoteById,
        getJobsForClient,
        getInvoicesForClient,
        getInvoicesForJob,
        getQuotesForClient,
        getQuotesForJob,
        getNotesForClient,
        getActiveJobs,
        getJobCountForClient,
        getTotalRevenue,
        getPendingRevenue,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
