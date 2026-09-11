import { useCallback, useEffect, useRef, useState } from 'react';
import { notesApi, errorMessage } from '../services/api';
import type { Health, NoteInput, StudyNote } from '../types/notes';
export function useNotes() {
  const [notes,setNotes] = useState<StudyNote[]>([]);
  const [health,setHealth] = useState<Health | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState<string | null>(null);
  const sequence = useRef(0), mounted = useRef(false), mutation = useRef(false);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const [data, status] = await Promise.all([notesApi.list(),notesApi.health()]);
      if (mounted.current && request === sequence.current) { setNotes(data); setHealth(status); setError(''); }
    } catch (err) { if (mounted.current && request === sequence.current) setError(errorMessage(err)); }
    finally { if (mounted.current) setLoading(false); }
  },[]);
  useEffect(() => {
    mounted.current = true;
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => { if (!mutation.current) void refresh(); },2500);
    return () => { mounted.current = false; window.clearTimeout(initial); window.clearInterval(timer); };
  },[refresh]);
  const mutate = useCallback(async (key: string, operation: () => Promise<StudyNote | void>) => {
    if (mutation.current) return false;
    mutation.current = true; ++sequence.current; setBusy(key); setError('');
    try {
      await operation(); await refresh(); return true;
    } catch (err) { if (mounted.current) setError(errorMessage(err)); return false; }
    finally { mutation.current = false; if (mounted.current) setBusy(null); }
  },[refresh]);
  return { notes, health, loading, error, busy, refresh,
    save: (input: NoteInput, id?: string) => mutate(id || 'new',() => id ? notesApi.edit(id,input) : notesApi.create(input)),
    complete: (id: string) => mutate(id,() => notesApi.complete(id)),
    remove: (id: string) => mutate(id,() => notesApi.remove(id)),
  };
}
