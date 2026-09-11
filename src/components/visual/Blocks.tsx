import { ArrowRight, Quote } from 'lucide-react';
import type { VisualBlock, Person } from '../../types/notes';
type Block<T extends VisualBlock['type']> = Extract<VisualBlock,{type:T}>;
export function HeadingBlock({block}:{block:Block<'heading'>}) { return <section className="sheet-heading"><h3>{block.text}</h3><p>{block.subtitle}</p></section>; }
export function ParagraphBlock({block}:{block:Block<'paragraph'>}) { return <p className="sheet-paragraph">{block.text}</p>; }
export function TimelineBlock({block}:{block:Block<'timeline'>}) { return <section className="timeline-block"><h3 className="hand-title">{block.title} <span>↴</span></h3><ol className="timeline">{block.events.map((event,i)=><li key={i}><span className="timeline-date">{event.date}</span><strong>{event.title}</strong><p>{event.detail}</p></li>)}</ol></section>; }
function PersonColumn({person}:{person:Person}) { return <div className="person-column"><h4>{person.name}</h4><em>{person.role}</em><ul>{person.points.map((point,i)=><li key={i}>{point}</li>)}</ul></div>; }
export function ComparisonBlock({block}:{block:Block<'comparison'>}) { return <section className="comparison-block"><h3 className="sr-only">{block.title}</h3><PersonColumn person={block.left}/><span className="versus">vs.</span><PersonColumn person={block.right}/></section>; }
export function QuoteBlock({block}:{block:Block<'quote'>}) { return <figure className="quote-block"><Quote size={23}/><blockquote>{block.text}</blockquote><p>{block.translation}</p><figcaption>{block.attribution}</figcaption></figure>; }
export function AnnotationBlock({block}:{block:Block<'annotation'>}) { return <aside className={'annotation '+block.tone}><span className="annotation-star">✳</span><div><h3>{block.title}</h3><p>{block.text}</p></div></aside>; }
export function DiagramBlock({block}:{block:Block<'diagram'>}) {
 return <section className="diagram-block"><h3 className="hand-title">{block.title}</h3><div className="diagram-nodes">{block.nodes.map(node=><span key={node.id}>{node.label}</span>)}</div><ul className="diagram-edges">{block.edges.map((edge,i)=><li key={i}><strong>{block.nodes.find(n=>n.id===edge.from)?.label}</strong><span>{edge.label}<ArrowRight size={20}/></span><strong>{block.nodes.find(n=>n.id===edge.to)?.label}</strong></li>)}</ul></section>;
}
export function ImageBlock({block}:{block:Block<'image'>}) { return <figure className="image-block"><span className="tape"/><img src="/assets/roman-senate.svg" alt={block.alt}/><figcaption>{block.caption}</figcaption></figure>; }
export function RenderBlock({block}:{block:VisualBlock}) {
 switch(block.type) {
 case 'heading':return <HeadingBlock block={block}/>;
 case 'paragraph':return <ParagraphBlock block={block}/>;
 case 'timeline':return <TimelineBlock block={block}/>;
 case 'comparison':return <ComparisonBlock block={block}/>;
 case 'quote':return <QuoteBlock block={block}/>;
 case 'annotation':return <AnnotationBlock block={block}/>;
 case 'diagram':return <DiagramBlock block={block}/>;
 case 'image':return <ImageBlock block={block}/>;
 }
}
