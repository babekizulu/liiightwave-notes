import type { User } from './components/AuthGate';
import { useState } from 'react';
import { Plus, RefreshCw, NotebookPen } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Note from './components/Note';
import Tray from './components/Tray';
import SearchBar from './components/SearchBar';
import NoteEditor from './components/NoteEditor';
import { useNotes } from './hooks/useNotes';
import type { Filter, StudyNote } from './types/notes';
import './scss/main.scss';
export default function App({user,onAccount}:{user:User;onAccount:()=>void}) {
 const state=useNotes();
 const [filter,setFilter]=useState<Filter>('all'),[search,setSearch]=useState(''),[selectedId,setSelectedId]=useState<string|null>(null);
 const [editor,setEditor]=useState<{note:StudyNote|null}|null>(null);
 const filtered=state.notes.filter(note=>(filter==='all'||(filter==='ready'?note.status==='ready':note.status!=='ready'))&&[note.title,note.subject,note.content].join(' ').toLowerCase().includes(search.toLowerCase()));
 const selected=filtered.find(note=>note.id===selectedId)||filtered[0];
 const ready=state.notes.filter(n=>n.status==='ready').length;
 return <div className="app"><a href="#notes" className="skip-link">Skip to notes</a><Sidebar user={user} onAccount={onAccount} filter={filter} onFilter={setFilter} notes={state.notes}/><main><Header mode={state.health?.generationMode} onNew={()=>setEditor({note:null})}/>{state.error&&<div className="error-banner" role="alert">{state.error}<button onClick={()=>void state.refresh()}><RefreshCw size={15}/>Reconnect</button></div>}<div className="workspace" id="notes"><section className="notes-panel" aria-label="Study notes"><div className="panel-heading"><h2>{filter==='ready'?'Visual notes':filter==='draft'?'In progress':'Your notebook'} <span>{filtered.length}</span></h2><button className="icon-button" aria-label="Add study note" onClick={()=>setEditor({note:null})}><Plus size={19}/></button></div><button className="quick-capture" onClick={()=>setEditor({note:null})}><Plus size={18}/>What are you thinking about?</button><SearchBar value={search} onChange={setSearch}/><div className="list-caption"><span>Thoughts & connections</span><span>↓ Recent</span></div><div className="note-list">{state.loading?<p className="list-empty" role="status">Opening your notebook…</p>:filtered.length?filtered.map(note=><Note key={note.id} note={note} selected={note.id===selected?.id} busy={!!state.busy} onSelect={()=>setSelectedId(note.id)} onComplete={()=>void state.complete(note.id)}/>):<div className="list-empty"><NotebookPen size={28}/><h3>{search?'No matching thoughts.':'A fresh page awaits.'}</h3><p>{search?'Try another word.':'Add your first study note to get started.'}</p><button className="secondary" onClick={()=>setEditor({note:null})}>New note</button></div>}</div><div className="notebook-footer"><span>✧ {ready} {ready===1?'idea':'ideas'} brought to light</span><p>Tick a note to make it visual.</p></div></section>{selected?<Tray key={selected.id} note={selected} busy={!!state.busy} onEdit={()=>setEditor({note:selected})} onComplete={()=>void state.complete(selected.id)} onDelete={()=>void state.remove(selected.id)}/>:<section className="blank-tray"><NotebookPen size={42}/><h2>Your next idea starts here.</h2><p>Add a study note, then complete it to create a visual note.</p></section>}</div></main>{editor&&<NoteEditor key={editor.note?.id||'new'} note={editor.note} busy={!!state.busy} error={state.error} onSave={state.save} onClose={()=>setEditor(null)}/>}</div>;
}
