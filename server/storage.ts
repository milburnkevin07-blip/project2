import { db } from "./db";
import { 
  type User, 
  type InsertUser,
  type JobNote,
  type InsertJobNote 
} from "../shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getJobNotes(jobId: string): Promise<JobNote[]>;
  createJobNote(note: InsertJobNote): Promise<JobNote>;
  deleteJobNote(noteId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { users } = await import("../shared/schema");
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { users } = await import("../shared/schema");
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { users } = await import("../shared/schema");
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getJobNotes(jobId: string): Promise<JobNote[]> {
    console.log("🔍 getJobNotes called with jobId:", jobId);
    const { jobNotes } = await import("../shared/schema");
    console.log("🔍 jobNotes table:", jobNotes);
    const result = await db
      .select()
      .from(jobNotes)
      .where(eq(jobNotes.jobId, jobId))
      .orderBy(desc(jobNotes.createdAt));
    return result;
  }

  async createJobNote(note: InsertJobNote): Promise<JobNote> {
    console.log("📝 createJobNote called");
    const { jobNotes } = await import("../shared/schema");
    const result = await db.insert(jobNotes).values(note).returning();
    return result[0];
  }

  async deleteJobNote(noteId: string): Promise<void> {
    console.log("🗑️ deleteJobNote called with noteId:", noteId);
    const { jobNotes } = await import("../shared/schema");
    await db.delete(jobNotes).where(eq(jobNotes.id, noteId));
  }
}

export const storage = new DbStorage();