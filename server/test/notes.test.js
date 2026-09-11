import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { openDatabase,migrate } from '../src/db/database.js';
import { seed } from '../src/db/seed.js';
import { NotesRepository } from '../src/repositories/notes.repository.js';
import { createApp } from '../src/app.js';
import { createGenerator } from '../src/services/generation.service.js';
import { createWorker } from '../src/services/worker.js';
import { validateSpec } from '../src/types/visual-note.js';
import { cicero } from '../src/data/cicero.js';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../src/security/passwords.js';
let db,repo,app,cookie,csrf;
function authenticated(){return new Proxy({}, {get:(_,method)=>(path)=>request(app)[method](path).set('Cookie',cookie).set('X-CSRF-Token',csrf).set('X-Requested-With','LiiiGHTNOTES')});}
const input={title:'Photosynthesis',subject:'Biology',content:'Plants use light energy to convert carbon dioxide and water into sugars. Oxygen is released.'};
before(async()=>{db=await openDatabase();await migrate(db);const userId=randomUUID();await db.query('INSERT INTO users(id,email,name,password_hash,email_verified_at) VALUES($1,$2,$3,$4,NOW())',[userId,'notes-test@example.test','Test',await hashPassword('A lengthy unique testing passphrase!')]);repo=new NotesRepository(db,userId);app=createApp(repo,{origin:'http://localhost:5173',mode:'demo',checkBreaches:false});const login=await request(app).post('/api/auth/login').set('X-Requested-With','LiiiGHTNOTES').send({email:'notes-test@example.test',password:'A lengthy unique testing passphrase!'}).expect(200);cookie=login.headers['set-cookie'];csrf=login.body.csrfToken;});
after(async()=>{await db.close();});
test('demo seed is valid and idempotent',async()=>{assert.equal(validateSpec(cicero).version,1);await seed(db);await seed(db);assert.equal((await new NotesRepository(db).list()).length,1);});
test('API rejects empty, oversized and malformed inputs',async()=>{
 await authenticated().post('/api/notes').send({...input,title:' '}).expect(400);
 await authenticated().post('/api/notes').send({...input,content:'a'.repeat(20001)}).expect(400);
 await authenticated().get('/api/notes/nope').expect(400);
 await authenticated().get('/api/notes/00000000-0000-4000-8000-000000000000').expect(404);
 await authenticated().post('/api/notes').set('Origin','https://untrusted.example').send(input).expect(403);
});
test('completion is idempotent, worker produces structured output, editing resets it',async()=>{
 const {body:note}=await authenticated().post('/api/notes').send(input).expect(201);
 const results=await Promise.all([authenticated().patch('/api/notes/'+note.id+'/complete'),authenticated().patch('/api/notes/'+note.id+'/complete')]);
 assert.ok(results.every(r=>r.status===202));
 assert.equal((await repo.jobs(note.id)).length,1);
 await authenticated().patch('/api/notes/'+note.id).send(input).expect(409);
 await authenticated().delete('/api/notes/'+note.id).expect(409);
 const worker=createWorker(repo,createGenerator({mode:'demo'}));
 await worker.tick();
 const ready=await repo.get(note.id);
 assert.equal(ready.status,'ready');validateSpec(ready.visual);
 assert.ok(ready.visual.blocks.some(b=>b.type==='paragraph'&&b.text===input.content));
 await repo.complete(note.id);assert.equal((await repo.jobs(note.id)).length,1);
 const edited=await repo.edit(note.id,{...input,title:'Edited'});
 assert.equal(edited.status,'draft');assert.equal(edited.visual,null);
 await authenticated().delete('/api/notes/'+note.id).expect(204);
 await authenticated().get('/api/notes/'+note.id).expect(404);
});
test('failed generation is persisted and can be retried without leaking errors',async()=>{
 const note=await repo.create(input);await repo.complete(note.id);
 await createWorker(repo,async()=>{throw new Error('secret-api-token');}).tick();
 const failed=await repo.get(note.id);assert.equal(failed.status,'failed');assert.ok(!failed.error.includes('secret'));
 await repo.complete(note.id);await createWorker(repo,createGenerator({mode:'demo'})).tick();
 assert.equal((await repo.get(note.id)).status,'ready');assert.equal((await repo.jobs(note.id)).length,2);
});
test('expired jobs become retryable and stale worker cannot overwrite new result',async()=>{
 const note=await repo.create(input);await repo.complete(note.id);const stale=await repo.claim();
 await db.query("UPDATE generation_jobs SET started_at=NOW()-INTERVAL '10 minutes' WHERE id=$1",[stale.id]);
 await repo.recover();assert.equal((await repo.get(note.id)).status,'failed');
 await repo.complete(note.id);await createWorker(repo,createGenerator({mode:'demo'})).tick();
 await repo.finish(stale,null,'stale failure');
 assert.equal((await repo.get(note.id)).status,'ready');
});
test('invalid diagram edges are rejected',()=>{
 const spec=structuredClone(cicero);spec.blocks=[{type:'diagram',title:'Bad',nodes:[{id:'a',label:'A'}],edges:[{from:'a',to:'missing',label:'to'}]}];
 assert.throws(()=>validateSpec(spec),/relationships/);
});
