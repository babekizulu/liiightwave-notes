import { Check, Circle, LoaderCircle, RotateCcw } from 'lucide-react';
import type { StudyNote } from '../types/notes';
const labels = {draft:'In progress',queued:'In the queue',processing:'Making connections…',ready:'Visual note ready',failed:'Needs a retry'};
export default function Note({ note,selected,busy,onSelect,onComplete }: {note:StudyNote;selected:boolean;busy:boolean;onSelect:()=>void;onComplete:()=>void}) {
 const active = ['queued','processing'].includes(note.status);
 return <article className={'note-card '+(selected?'selected':'')}><button className={'complete-toggle '+(note.status==='ready'?'checked':'')} disabled={busy||active||note.status==='ready'} onClick={onComplete} aria-label={note.status==='failed'?'Retry '+note.title:'Complete '+note.title} title="Complete this note to create a visual note">{active?<LoaderCircle size={20} className="spin"/>:note.status==='ready'?<Check size={16}/>:note.status==='failed'?<RotateCcw size={18}/>:<Circle size={21}/>}</button><button className="note-select" onClick={onSelect} aria-pressed={selected}><span className="note-subject">{note.subject}</span><h3>{note.title}</h3><p>{note.content}</p><div className={'note-status '+note.status} role="status">{labels[note.status]}</div></button></article>;
}
