import { RenderBlock } from './visual/Blocks';
import type { VisualNoteSpec } from '../types/notes';
const safeUrl = (url:string) => { try { const parsed=new URL(url);return parsed.protocol==='https:'||parsed.protocol==='http:'?url:undefined; }catch{return undefined;} };
export default function VisualNote({spec}:{spec:VisualNoteSpec}) {
 return <article className="visual-sheet"><div className="sheet-topline"><span>LiiiGHTNOTES / FIELD NOTES</span><span>01</span></div><header className="sheet-title"><span className="sheet-subject">{spec.subject}</span><h2>{spec.title}</h2><p>{spec.subtitle}</p></header><div className="keywords">{spec.keywords.map((word,i)=><span key={i}>{word}</span>)}</div><p className="sheet-summary">{spec.summary}</p><div className="sheet-blocks">{spec.blocks.map((block,i)=><RenderBlock key={i} block={block}/>)}</div>{spec.sources.length>0&&<footer className="sheet-sources"><span>Keep exploring</span>{spec.sources.map((source,i)=><a key={i} href={safeUrl(source.url)} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</footer>}<div className="sheet-end">a little light, a lasting idea. ✧</div></article>;
}
