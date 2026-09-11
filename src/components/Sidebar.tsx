import { BookOpen, FileText, Layers, Sparkles } from 'lucide-react';
import Logo from './Logo';
import type { User } from './AuthGate';
import type { Filter, StudyNote } from '../types/notes';
interface Props { user:User; onAccount:()=>void; filter: Filter; onFilter: (filter: Filter) => void; notes: StudyNote[] }
export default function Sidebar({ filter,onFilter,notes,user,onAccount }: Props) {
  const items = [{ id:'all' as const, label:'All notes', icon:Layers, count:notes.length },{ id:'draft' as const,label:'In progress',icon:FileText,count:notes.filter(n=>n.status!=='ready').length },{ id:'ready' as const,label:'Visual notes',icon:Sparkles,count:notes.filter(n=>n.status==='ready').length }];
  return (
    <aside className="sidebar"><Logo/><div className="workspace-label">PERSONAL WORKSPACE</div><nav aria-label="Notes navigation">{items.map(item=><button aria-label={item.label} key={item.id} className={filter===item.id?'nav-item active':'nav-item'} onClick={()=>onFilter(item.id)} aria-current={filter===item.id?'page':undefined}><item.icon size={18}/><span>{item.label}</span><small>{item.count}</small></button>)}</nav><div className="sidebar-tip"><BookOpen size={23}/><h3>Follow a thought.<br/>See where it goes.</h3><p>Write it down. Make connections. Let it sink in.</p><div className="tip-sketch">a thought → a little light ✧</div></div><button className="profile profile-button" aria-label="Account settings" onClick={onAccount}><span aria-hidden="true">{user.name.slice(0,2).toUpperCase()}</span><div>{user.name}<small>Account settings</small></div></button></aside>
  );
}
