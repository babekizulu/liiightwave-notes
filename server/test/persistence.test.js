import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase,migrate } from '../src/db/database.js';
import { seedOnce } from '../src/db/seed.js';
import { NotesRepository } from '../src/repositories/notes.repository.js';
import { demoId } from '../src/data/cicero.js';
test('notes and queued jobs survive database reopen; deleted demo stays deleted',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'liiightnotes-test-'));
 let db;
 try {
  db=await openDatabase({dataDir:directory}); await migrate(db); await seedOnce(db);
  let repo=new NotesRepository(db);
  await repo.remove(demoId);
  const note=await repo.create({title:'Persist me',subject:'Test',content:'A durable thought.'});
  await repo.complete(note.id); await db.close(); db=null;
  db=await openDatabase({dataDir:directory}); await migrate(db); await seedOnce(db);
  repo=new NotesRepository(db);
  assert.equal((await repo.get(note.id)).status,'queued');
  assert.equal((await repo.jobs(note.id)).length,1);
  await assert.rejects(repo.get(demoId),/not found/);
 } finally { if(db)await db.close(); await rm(directory,{recursive:true,force:true}); }
});
