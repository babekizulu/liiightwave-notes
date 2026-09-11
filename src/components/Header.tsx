import { Plus } from 'lucide-react';
export default function Header({ onNew, mode }: { onNew:()=>void; mode?:string }) { 
    return (
    <header className="header">
        <div>
            <div className="eyebrow">MAKE ROOM FOR A LITTLE LIGHT</div>
            <h1>A little room <em>to think.</em></h1>
            <p>A quiet place to turn what you’re learning into something that stays.</p>
        </div>
        <div className="header-actions"><span className="mode-label">{mode==='openai'?'AI generation':mode==='demo'?'Demo workspace':'Connecting…'}</span><button className="primary" onClick={onNew}><Plus size={18}/>New note</button></div>
    </header>
    ); 
}
