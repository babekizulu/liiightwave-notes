import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { mkdir, readFile, readdir } from 'node:fs/promises';
export async function openDatabase({ databaseUrl, dataDir } = {}) {
  if (databaseUrl) {
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 15000 });
    await pool.query('SELECT 1');
    return {
      kind: 'postgresql', query: (sql, args) => pool.query(sql, args),
      transaction: async fn => {
        const client = await pool.connect();
        try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
        catch (error) { await client.query('ROLLBACK'); throw error; }
        finally { client.release(); }
      }, close: () => pool.end(),
    };
  }
  if (dataDir) await mkdir(dataDir, { recursive: true });
  const db = new PGlite(dataDir);
  await db.waitReady;
  return { kind: 'embedded-postgresql', query: (sql, args) => db.query(sql, args), transaction: fn => db.transaction(fn), close: () => db.close() };
}
export async function migrate(db) {
  const files=(await readdir(new URL('./migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();
  const sql=(await Promise.all(files.map(f=>readFile(new URL('./migrations/'+f,import.meta.url),'utf8')))).join('\n');
  // This initial migration is idempotent; future migrations must receive new files.
  await db.transaction(async tx => {
    for (const statement of sql.split(';').map(x => x.trim()).filter(Boolean)) await tx.query(statement);
  });
}
