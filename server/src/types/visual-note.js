import { z } from 'zod';
const text = z.string().min(1).max(4000);
const heading = z.object({ type: z.literal('heading'), text, subtitle: z.string().max(1000) });
const paragraph = z.object({ type: z.literal('paragraph'), text });
const timeline = z.object({ type: z.literal('timeline'), title: text, events: z.array(z.object({ date: text, title: text, detail: text })).min(1).max(8) });
const comparison = z.object({ type: z.literal('comparison'), title: text, left: z.object({ name: text, role: text, points: z.array(text).min(1).max(5) }), right: z.object({ name: text, role: text, points: z.array(text).min(1).max(5) }) });
const quote = z.object({ type: z.literal('quote'), text, attribution: text, translation: text });
const diagram = z.object({ type: z.literal('diagram'), title: text, nodes: z.array(z.object({ id: text, label: text })).min(1).max(8), edges: z.array(z.object({ from: text, to: text, label: text })).max(12) });
const annotation = z.object({ type: z.literal('annotation'), title: text, text, tone: z.enum(['sage', 'rose', 'gold']) });
const image = z.object({ type: z.literal('image'), assetId: z.enum(['roman-senate']), caption: text, alt: text });
export const VisualNoteSpec = z.object({
  version: z.literal(1), title: text, subtitle: text,
  subject: text, summary: text, keywords: z.array(text).max(8),
  blocks: z.array(z.discriminatedUnion('type', [heading, paragraph, timeline, comparison, quote, diagram, annotation, image])).min(1).max(20),
  sources: z.array(z.object({ title: text, url: z.string().url() })).max(10),
});
export function validateSpec(value) {
  const spec = VisualNoteSpec.parse(value);
  for (const block of spec.blocks) {
    if (block.type !== 'diagram') continue;
    const ids = new Set(block.nodes.map(n => n.id));
    if (ids.size !== block.nodes.length || block.edges.some(e => !ids.has(e.from) || !ids.has(e.to))) throw new Error('Invalid diagram relationships');
  }
  return spec;
}
export const NoteInput = z.object({ title: z.string().trim().min(1).max(160), content: z.string().trim().min(1).max(20000), subject: z.string().trim().min(1).max(60) }).strict();
