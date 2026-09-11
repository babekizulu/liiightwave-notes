export const demoId = '63bce000-0000-4000-8000-000000000001';
export const cicero = {
  version: 1, title: 'Cicero vs. Catiline', subtitle: 'A republic on the edge.',
  subject: 'Ancient history', summary: 'In 63 BCE, a conspiracy exposed the fault lines of the Roman Republic: ambition, inequality, and the limits of emergency power.',
  keywords: ['63 BCE', 'Roman Republic', 'Rhetoric', 'Power & principle'],
  blocks: [
    { type: 'image', assetId: 'roman-senate', alt: 'Ink illustration of the Roman Senate: an orator faces an isolated senator beneath classical columns.', caption: 'Rome, 63 BCE • The Senate becomes a stage. Original schematic illustration; not a historical reconstruction.' },
    { type: 'heading', text: 'Two men. One fragile republic.', subtitle: 'Follow the motives, then question the methods.' },
    { type: 'comparison', title: 'Who stood for what?', left: { name: 'CICERO', role: 'The consul & orator', points: ['Consul in 63 BCE; a “new man” in Roman politics.', 'Presented himself as the defender of the Republic.', 'Used speeches and emergency authority to confront the conspiracy.'] }, right: { name: 'CATILINE', role: 'The senator & conspirator', points: ['An aristocrat with frustrated political ambitions.', 'Sought support among people burdened by debt.', 'Led a conspiracy; later died fighting near Pistoria in 62 BCE.'] } },
    { type: 'annotation', title: 'The big question', text: 'Can you defend a republic by stepping outside its protections?', tone: 'gold' },
    { type: 'timeline', title: 'The turning points', events: [
      { date: '63 BCE', title: 'Political pressure builds', detail: 'Debt, inequality and elite competition feed unrest.' },
      { date: '8 NOV', title: 'Cicero speaks', detail: 'The first Catilinarian oration attacks Catiline in the Senate.' },
      { date: '5 DEC', title: 'A dangerous precedent', detail: 'Five conspirators in Rome are executed without a regular trial.' },
      { date: '62 BCE', title: 'The final battle', detail: 'Catiline dies near Pistoria. The political questions remain.' }
    ] },
    { type: 'quote', text: 'Quo usque tandem abutere, Catilina, patientia nostra?', attribution: 'Cicero • First Catilinarian, 1', translation: 'How long, Catiline, will you abuse our patience?' },
    { type: 'diagram', title: 'Trace the tension', nodes: [{id:'pressure',label:'Debt & ambition'},{id:'conspiracy',label:'Conspiracy'},{id:'response',label:'Emergency power'}], edges: [{from:'pressure',to:'conspiracy',label:'fuel unrest'},{from:'conspiracy',to:'response',label:'prompts'}] },
    { type: 'annotation', title: 'Read with a critical eye', text: 'Much of the surviving story comes from Cicero and Sallust. Separate reported events from the authors’ political framing.', tone: 'rose' },
  ],
  sources: [
    { title: 'Cicero • In Catilinam 1 (Latin)', url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0010:text=Catil.:speech=1:chapter=1' },
    { title: 'Sallust • The War with Catiline', url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Sallust/Bellum_Catilinae*.html' }
  ]
};
export const demoContent = 'In 63 BCE, Cicero was consul and Catiline was accused of conspiring against the Roman Republic. Cicero attacked Catiline in the Senate on 8 November. On 5 December, five conspirators were executed without a regular trial. Catiline died fighting near Pistoria in 62 BCE. Compare their ambitions, methods, and the tension between security and civil protections. Consider how Cicero and Sallust shape our understanding.';
