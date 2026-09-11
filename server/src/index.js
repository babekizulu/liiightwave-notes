import { config } from './config.js';
import { openDatabase, migrate } from './db/database.js';
import { seedOnce } from './db/seed.js';
import { NotesRepository } from './repositories/notes.repository.js';
import { createGenerator } from './services/generation.service.js';
import { createWorker } from './services/worker.js';
import { createApp } from './app.js';
const db = await openDatabase(config);
await migrate(db); if(!config.production && config.seedDemo)await seedOnce(db);
const repo = new NotesRepository(db), worker = createWorker(repo, createGenerator(config));
const cleanup=setInterval(()=>{void db.query("DELETE FROM sessions WHERE expires_at<NOW() OR last_seen_at<NOW()-INTERVAL '24 hours'").then(()=>db.query('DELETE FROM account_tokens WHERE expires_at<NOW()')).then(()=>db.query('DELETE FROM rate_limits WHERE expires_at<NOW()')).then(()=>db.query("DELETE FROM security_events WHERE created_at<NOW()-INTERVAL '90 days'")).catch(()=>console.error('Storage cleanup failed'));},3600000);cleanup.unref();
const server = createApp(repo, config).listen(config.port, config.host, () => {
  console.log('LiiiGHTNOTES API: http://' + config.host + ':' + config.port + ' • ' + config.mode + ' • ' + db.kind);
  worker.start();
});
let closing = false;
async function close() {
  if (closing) return; closing = true;
  clearInterval(cleanup);server.close();
  setTimeout(()=>process.exit(1),150000).unref();
  await worker.stop(); await db.close(); process.exit(0);
}
process.on('SIGINT',close); process.on('SIGTERM',close);
