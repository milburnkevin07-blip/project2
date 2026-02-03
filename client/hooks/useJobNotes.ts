// API hooks for job notes
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface JobNote {
  id: string;
  jobId: string;
  noteText: string;
  createdAt: string;
}

// Get your API URL from environment or use localhost for development
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.125:5000";

// Fetch notes for a job
export function useJobNotes(jobId: string) {
  return useQuery({
    queryKey: ["jobNotes", jobId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/notes`);
      if (!response.ok) throw new Error("Failed to fetch notes");
      const data = await response.json();
      return data.notes as JobNote[];
    },
    enabled: !!jobId,
  });
}

// Create a new note
export function useCreateJobNote(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteText: string) => {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteText }),
      });
      if (!response.ok) throw new Error("Failed to create note");
      const data = await response.json();
      return data.note as JobNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobNotes", jobId] });
    },
  });
}

// Delete a note
export function useDeleteJobNote(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobNotes", jobId] });
    },
  });
}