import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {openDatabase,migrate} from '../src/db/database.js';
import {NotesRepository} from '../src/repositories/notes.repository.js';
import {createApp} from '../src/app.js';
import {createWorker} from '../src/services/worker.js';
import {createGenerator} from '../src/services/generation.service.js';
import {consumeLimit,digest} from '../src/security/limits.js';
import {verifyPassword} from '../src/security/passwords.js';
let db,repo,app;
const mail=[];
const password='A quiet oak desk beside the window!';
const config={origin:'http://localhost:5173',mode:'demo',checkBreaches:false,dailyGenerations:2,globalDailyGenerations:5};
const input={title:'Light & growth',subject:'Biology',content:'Plants convert sunlight into chemical energy.'};
function http(agent=request(app),csrf){return new Proxy({}, {get:(_,method)=>(path)=>{const r=agent[method](path).set('X-Requested-With','LiiiGHTNOTES').set('Origin',config.origin);if(csrf)r.set('X-CSRF-Token',csrf);return r;}});}
async function register(email,verified=true){
 await http().post('/api/auth/register').send({name:'Study Tester',email,password}).expect(202);
 const token=mail.findLast(m=>m.email===email&&m.purpose==='verify').token;
 if(verified)await http().post('/api/auth/verify-email').send({token}).expect(200);
 const agent=request.agent(app);
 const login=await http(agent).post('/api/auth/login').send({email,password}).expect(200);
 return {agent,csrf:login.body.csrfToken,user:login.body.user,token,client:http(agent,login.body.csrfToken),cookie:login.headers['set-cookie']};
}
before(async()=>{db=await openDatabase();await migrate(db);repo=new NotesRepository(db);app=createApp(repo,config,{sendMail:async(email,purpose,token)=>{mail.push({email,purpose,token});}});});
beforeEach(async()=>{await db.query('DELETE FROM rate_limits');});
after(async()=>{await db.close();});
test('registration, one-use email verification, safe cookies, hashed passwords, and no anonymous access',async()=>{
 const a=await register('registration@example.test',false);
 await request(app).get('/api/notes').expect(401);
 await a.client.get('/api/notes').expect(403);
 await a.client.post('/api/auth/verify-email').send({token:a.token}).expect(200);
 await a.client.post('/api/auth/verify-email').send({token:a.token}).expect(400);
 await a.client.get('/api/notes').expect(200);
 assert.match(a.cookie.join(''),/HttpOnly/);assert.match(a.cookie.join(''),/SameSite=Lax/);
 const stored=(await db.query('SELECT password_hash FROM users WHERE id=$1',[a.user.id])).rows[0].password_hash;
 assert.ok(!stored.includes(password));assert.ok(await verifyPassword(password,stored));
 const s=await a.client.get('/api/auth/session').expect(200);assert.ok(!('password_hash' in s.body.user));
 assert.equal((await db.query('SELECT token_hash FROM sessions WHERE user_id=$1',[a.user.id])).rows[0].token_hash.length,64);
});
test('cross-account list, get, edit, delete, jobs and generation are isolated; legacy notes stay private',async()=>{
 const a=await register('owner@example.test'),b=await register('other@example.test');
 await repo.create({...input,title:'Legacy private note'});
 const n=(await a.client.post('/api/notes').send(input).expect(201)).body;
 assert.equal((await b.client.get('/api/notes').expect(200)).body.length,0);
 for(const path of [`/api/notes/${n.id}`,`/api/notes/${n.id}/jobs`])await b.client.get(path).expect(404);
 await b.client.patch(`/api/notes/${n.id}`).send({...input,title:'stolen'}).expect(404);
 await b.client.patch(`/api/notes/${n.id}/complete`).expect(404);
 await b.client.delete(`/api/notes/${n.id}`).expect(404);
 await a.client.patch(`/api/notes/${n.id}/complete`).expect(202);
 await createWorker(repo,createGenerator(config)).tick();
 assert.equal((await a.client.get(`/api/notes/${n.id}`).expect(200)).body.status,'ready');
 const exported=await a.client.get('/api/auth/export').expect(200);assert.equal(exported.body.notes.length,1);
 await a.client.patch(`/api/notes/${n.id}`).send({...input,title:'Updated'}).expect(200);
 await a.client.delete(`/api/notes/${n.id}`).expect(204);
});
test('CSRF, disallowed origins and missing security headers are rejected',async()=>{
 const a=await register('csrf@example.test');
 await http(a.agent).post('/api/notes').send(input).expect(403);
 await a.client.post('/api/notes').set('Origin','https://attacker.example').send(input).expect(403);
 await a.agent.post('/api/notes').send(input).expect(403);
 await a.client.post('/api/notes').send(input).expect(201);
});
test('recovery links expire, cannot be replayed, and invalidate every session',async()=>{
 const a=await register('recover@example.test');
 await http().post('/api/auth/forgot-password').send({email:a.user.email}).expect(200);
 const reset=mail.findLast(m=>m.email===a.user.email&&m.purpose==='reset').token;
 await db.query("UPDATE account_tokens SET expires_at=NOW()-INTERVAL '1 minute' WHERE token_hash=$1",[digest(reset)]);
 await http().post('/api/auth/reset-password').send({token:reset,password}).expect(400);
 await http().post('/api/auth/forgot-password').send({email:a.user.email}).expect(200);
 const fresh=mail.findLast(m=>m.email===a.user.email&&m.purpose==='reset').token;
 const newPassword='Another unique phrase with five quiet words!';
 await http().post('/api/auth/reset-password').send({token:fresh,password:newPassword}).expect(200);
 await a.client.get('/api/notes').expect(401);
 await http().post('/api/auth/reset-password').send({token:fresh,password:newPassword}).expect(400);
 await http().post('/api/auth/login').send({email:a.user.email,password}).expect(401);
 await http().post('/api/auth/login').send({email:a.user.email,password:newPassword}).expect(200);
});
test('expired sessions and logout-all revoke access',async()=>{
 const a=await register('expiry@example.test');
 await db.query("UPDATE sessions SET last_seen_at=NOW()-INTERVAL '25 hours' WHERE user_id=$1",[a.user.id]);
 await a.client.get('/api/notes').expect(401);
 const r=await http(a.agent).post('/api/auth/login').send({email:a.user.email,password}).expect(200);
 await http(a.agent,r.body.csrfToken).post('/api/auth/logout-all').expect(204);
 await a.client.get('/api/notes').expect(401);
});
test('account deletion requires password and removes owned records',async()=>{
 const a=await register('delete@example.test');
 await a.client.post('/api/notes').send(input).expect(201);
 await a.client.delete('/api/auth/account').send({password:'wrong'}).expect(401);
 await a.client.delete('/api/auth/account').send({password}).expect(204);
 await a.client.get('/api/notes').expect(401);
 assert.equal((await db.query('SELECT id FROM users WHERE id=$1',[a.user.id])).rows.length,0);
 assert.equal((await db.query('SELECT id FROM notes WHERE user_id=$1',[a.user.id])).rows.length,0);
});
test('persistent rate limits are atomic and quotas prevent excess generation',async()=>{
 const attempts=await Promise.allSettled(Array.from({length:8},()=>consumeLimit(db,'atomic-test',3,60)));
 assert.equal(attempts.filter(r=>r.status==='fulfilled').length,3);
 const a=await register('quota@example.test');
 for(let i=0;i<3;i++){const n=(await a.client.post('/api/notes').send(input).expect(201)).body;await a.client.patch(`/api/notes/${n.id}/complete`).expect(i<2?202:429);}
});
test('production uses Secure host-only cookies and no-store responses',async()=>{
 const production=createApp(repo,{...config,production:true},{sendMail:async()=>{}});
 const response=await request(production).post('/api/auth/login').set('X-Requested-With','LiiiGHTNOTES').send({email:'quota@example.test',password}).expect(200);
 assert.match(response.headers['set-cookie'].join(''),/__Host-liiightnotes=/);assert.match(response.headers['set-cookie'].join(''),/Secure/);
 assert.match(response.headers['cache-control'],/no-store/);
});
