import { config } from '../config.js';
import { openDatabase, migrate } from './database.js';
const db = await openDatabase(config);
try { await migrate(db); console.log('Schema ready (' + db.kind + ').'); } finally { await db.close(); }
