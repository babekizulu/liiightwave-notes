import { Search } from 'lucide-react';
export default function SearchBar({ value,onChange }: { value:string; onChange:(value:string)=>void }) { return <label className="search"><Search size={17}/><input aria-label="Search notes" placeholder="Find a thought…" value={value} onChange={e=>onChange(e.target.value)}/></label>; }
