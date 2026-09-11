import { pathToFileURL } from 'node:url';
import { demoId, cicero, demoContent } from '../data/cicero.js';
import { validateSpec } from '../types/visual-note.js';
export async function seedOnce(db) {
  await db.transaction(async tx => {
    const result = await tx.query("INSERT INTO app_metadata(key) VALUES('demo_seeded') ON CONFLICT DO NOTHING RETURNING key");
    if (result.rows.length) await seed(tx);
  });
}
export async function seed(db) {
  validateSpec(cicero);
  await db.query("INSERT INTO notes(id,title,content,subject,status,visual) VALUES($1,$2,$3,$4,'ready',$5::jsonb) ON CONFLICT(id) DO NOTHING", [demoId,cicero.title,demoContent,cicero.subject,JSON.stringify(cicero)]);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { config } = await import('../config.js');
  const { openDatabase, migrate } = await import('./database.js');
  const db = await openDatabase(config);
  try { await migrate(db); await seed(db); console.log('Cicero demo ready.'); } finally { await db.close(); }
}
