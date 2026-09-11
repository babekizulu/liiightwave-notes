import axios from 'axios';
import type { StudyNote, NoteInput, Health } from '../types/notes';
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 15000 });
export const notesApi = {
  list: async () => (await api.get<StudyNote[]>('/notes')).data,
  health: async () => (await api.get<Health>('/health')).data,
  create: async (note: NoteInput) => (await api.post<StudyNote>('/notes',note)).data,
  edit: async (id: string, note: NoteInput) => (await api.patch<StudyNote>('/notes/' + id,note)).data,
  complete: async (id: string) => (await api.patch<StudyNote>('/notes/' + id + '/complete')).data,
  remove: async (id: string) => { await api.delete('/notes/' + id); },
};
export function errorMessage(error: unknown): string {
  return axios.isAxiosError(error) ? error.response?.data?.error || 'Could not reach your notes. Check that the local server is running.' : 'Something went wrong. Please try again.';
}
