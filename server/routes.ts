import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // TEST ROUTE - just to see if routes work
  app.get("/api/test", (req, res) => {
    res.json({ message: "Routes are working!" });
  });
  
  // TEST: Create a sample job
  app.post("/api/test/create-job", async (req, res) => {
    try {
      const { users, clients, jobs } = await import("../shared/schema");
      
      // Create test user
      const [user] = await db.insert(users).values({
        username: "testuser",
        password: "test123"
      }).returning();
      
      // Create test client
      const [client] = await db.insert(clients).values({
        userId: user.id,
        name: "Test Client",
        company: "Test Co"
      }).returning();
      
      // Create test job
      const [job] = await db.insert(jobs).values({
        userId: user.id,
        clientId: client.id,
        title: "Test Job",
        description: "A test job for notes",
        status: "in_progress"
      }).returning();
      
      res.json({ job });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed" });
    }
  });
  
  // ============================================
  // JOB NOTES ROUTES
  // ============================================
  
  // GET /api/jobs/:jobId/notes - Fetch all notes for a job
  app.get("/api/jobs/:jobId/notes", async (req, res) => {
    try {
      const { jobId } = req.params;
      const notes = await storage.getJobNotes(jobId);
      res.json({ notes });
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // POST /api/jobs/:jobId/notes - Create a new note
  app.post("/api/jobs/:jobId/notes", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { noteText } = req.body;

      if (!noteText || noteText.trim().length === 0) {
        return res.status(400).json({ error: "Note text is required" });
      }

      const note = await storage.createJobNote({
        jobId,
        noteText: noteText.trim(),
      });

      res.status(201).json({ note });
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // DELETE /api/jobs/:jobId/notes/:noteId - Delete a note
  app.delete("/api/jobs/:jobId/notes/:noteId", async (req, res) => {
    try {
      const { noteId } = req.params;
      await storage.deleteJobNote(noteId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}