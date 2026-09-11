export type Status = 'draft' | 'queued' | 'processing' | 'ready' | 'failed';
export interface Person { name: string; role: string; points: string[] }
export type VisualBlock =
  | { type: 'heading'; text: string; subtitle: string }
  | { type: 'paragraph'; text: string }
  | { type: 'timeline'; title: string; events: { date: string; title: string; detail: string }[] }
  | { type: 'comparison'; title: string; left: Person; right: Person }
  | { type: 'quote'; text: string; attribution: string; translation: string }
  | { type: 'diagram'; title: string; nodes: { id: string; label: string }[]; edges: { from: string; to: string; label: string }[] }
  | { type: 'annotation'; title: string; text: string; tone: 'sage' | 'rose' | 'gold' }
  | { type: 'image'; assetId: 'roman-senate'; alt: string; caption: string };
export interface VisualNoteSpec { version: 1; title: string; subtitle: string; subject: string; summary: string; keywords: string[]; blocks: VisualBlock[]; sources: { title: string; url: string }[] }
export interface StudyNote { id: string; title: string; content: string; subject: string; status: Status; visual: VisualNoteSpec | null; error: string | null; created_at: string; updated_at: string }
export interface NoteInput { title: string; content: string; subject: string }
export interface Health { ok: boolean; generationMode: 'demo' | 'openai'; storage: string }
export type Filter = 'all' | 'draft' | 'ready';
