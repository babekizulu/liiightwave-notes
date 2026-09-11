import { Router } from 'express';
import { randomBytes,randomUUID,timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { digest,consumeLimit,rateLimit } from './limits.js';
import { hashPassword,verifyPassword,checkPassword } from './passwords.js';
import { HttpError } from '../repositories/notes.repository.js';
import { createMailer } from '../services/mail.service.js';
const emailSchema=z.string().trim().email().max(254).transform(v=>v.toLowerCase());
const passwordSchema=z.string().min(1).max(512);
const publicUser=u=>({id:u.id,name:u.name,email:u.email,verified:!!u.email_verified_at});
const newToken=()=>randomBytes(32).toString('hex');
export function createAuth(db,config,{sendMail=createMailer(config)}={}) {
 const cookieName=config.production?'__Host-liiightnotes':'liiightnotes_session';
 const cookieOptions={httpOnly:true,secure:!!config.production,sameSite:'lax',path:'/'};
 const event=async(userId,type)=>db.query('INSERT INTO security_events(id,user_id,event) VALUES($1,$2,$3)',[randomUUID(),userId,type]);
 const cookie=req=>(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 async function issue(res,userId,store=db) {
  const token=newToken();
  await store.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '7 days')",[digest(token),userId]);
  await store.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash IN (SELECT token_hash FROM sessions WHERE user_id=$1 ORDER BY created_at DESC OFFSET 10)',[userId]);
  res.cookie(cookieName,token,{...cookieOptions,maxAge:7*86400000});
  return digest('csrf:'+token);
 }
 async function load(req,_res,next) {
  const token=cookie(req);
  if(token && /^[a-f0-9]{64}$/.test(token)) {
   const {rows}=await db.query("SELECT u.*,s.token_hash,s.created_at AS session_created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND s.last_seen_at>NOW()-INTERVAL '24 hours'",[digest(token)]);
   if(rows[0]) { req.user=rows[0];req.csrf=digest('csrf:'+token);await db.query('UPDATE sessions SET last_seen_at=NOW() WHERE token_hash=$1',[digest(token)]); }
  }
  next();
 }
 const requireUser=(req,_res,next)=>{if(!req.user)throw new HttpError(401,'Please sign in to continue.');next();};
 const requireVerified=(req,_res,next)=>{if(!req.user?.email_verified_at)throw new HttpError(403,'Verify your email before opening your notebook.');next();};
 function csrf(req,_res,next) {
  if(req.user && !['GET','HEAD','OPTIONS'].includes(req.method)) {
   const supplied=Buffer.from(req.get('X-CSRF-Token')||'');const expected=Buffer.from(req.csrf);
   if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw new HttpError(403,'Your security token expired. Refresh the page and try again.');
  }
  next();
 }
 async function sendToken(user,purpose) {
  const token=newToken();
  await db.transaction(async tx=>{
   await tx.query('DELETE FROM account_tokens WHERE user_id=$1 AND purpose=$2',[user.id,purpose]);
   await tx.query("INSERT INTO account_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,$3,NOW()+$4*INTERVAL '1 minute')",[digest(token),user.id,purpose,purpose==='verify'?1440:30]);
  });
  try { await sendMail(user.email,purpose,token); }
  catch { await db.query('DELETE FROM account_tokens WHERE token_hash=$1',[digest(token)]);console.error(JSON.stringify({event:'mail_delivery_failed',purpose})); }
 }
 const router=Router();
 router.use(rateLimit(db,'auth',60,900));
 router.get('/session',(req,res)=>res.json({user:req.user?publicUser(req.user):null,csrfToken:req.csrf||null}));
 router.post('/register',rateLimit(db,'register',5,3600),async(req,res)=>{
  const input=z.object({name:z.string().trim().min(1).max(80),email:emailSchema,password:passwordSchema}).parse(req.body);
  await checkPassword(input.password,config.checkBreaches!==false);
  const hash=await hashPassword(input.password);
  const {rows}=await db.query('INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING *',[randomUUID(),input.email,input.name,hash]);
  if(rows[0]) { await event(rows[0].id,'registered');await sendToken(rows[0],'verify'); }
  res.status(202).json({message:'If this email can be registered, a verification link will arrive shortly. Already registered? Sign in or reset your password.'});
 });
 router.post('/login',rateLimit(db,'login',20,900),async(req,res)=>{
  const {email,password}=z.object({email:emailSchema,password:passwordSchema}).parse(req.body);
  await consumeLimit(db,'login-account:'+email,10,900);
  const user=(await db.query('SELECT * FROM users WHERE email=$1',[email])).rows[0];
  if(!await verifyPassword(password,user?.password_hash)||!user)throw new HttpError(401,'Email or password is incorrect.');
  const csrfToken=await db.transaction(async tx=>{
   const current=(await tx.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE',[user.id])).rows[0];
   if(!current||current.password_hash!==user.password_hash)throw new HttpError(401,'Your account changed. Please sign in again.');
   if(req.user)await tx.query('DELETE FROM sessions WHERE token_hash=$1',[req.user.token_hash]);
   return issue(res,user.id,tx);
  });
  await event(user.id,'signed_in');
  res.json({user:publicUser(user),csrfToken});
 });
 router.post('/logout',async(req,res)=>{if(req.user)await db.query('DELETE FROM sessions WHERE token_hash=$1',[req.user.token_hash]);res.clearCookie(cookieName,cookieOptions);res.status(204).end();});
 router.post('/logout-all',requireUser,async(req,res)=>{await db.query('DELETE FROM sessions WHERE user_id=$1',[req.user.id]);res.clearCookie(cookieName,cookieOptions);await event(req.user.id,'sessions_revoked');res.status(204).end();});
 router.post('/resend-verification',requireUser,rateLimit(db,'verify-email',5,3600),async(req,res)=>{
  if(!req.user.email_verified_at){await consumeLimit(db,'verify-user:'+req.user.id,3,3600);await sendToken(req.user,'verify');}
  res.json({message:'If verification is needed, a new link will arrive shortly. Check your spam folder too.'});
 });
 router.post('/verify-email',async(req,res)=>{
  const {token}=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).parse(req.body);
  await db.transaction(async tx=>{
   const t=(await tx.query("DELETE FROM account_tokens WHERE token_hash=$1 AND purpose='verify' AND expires_at>NOW() RETURNING user_id",[digest(token)])).rows[0];
   if(!t)throw new HttpError(400,'This verification link has expired or already been used.');
   await tx.query('UPDATE users SET email_verified_at=NOW() WHERE id=$1',[t.user_id]);
  });
  res.json({message:'Email verified. You can now sign in to your notebook.'});
 });
 router.post('/forgot-password',rateLimit(db,'recovery',5,3600),async(req,res)=>{
  const {email}=z.object({email:emailSchema}).parse(req.body);
  await consumeLimit(db,'recovery-email:'+email,3,3600);
  const user=(await db.query('SELECT * FROM users WHERE email=$1',[email])).rows[0];
  if(user)await sendToken(user,'reset');
  res.json({message:'If an account exists for this email, a reset link will arrive shortly.'});
 });
 router.post('/reset-password',rateLimit(db,'reset',10,3600),async(req,res)=>{
  const {token,password}=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:passwordSchema}).parse(req.body);
  await checkPassword(password,config.checkBreaches!==false);
  const hash=await hashPassword(password);
  await db.transaction(async tx=>{
   const t=(await tx.query("DELETE FROM account_tokens WHERE token_hash=$1 AND purpose='reset' AND expires_at>NOW() RETURNING user_id",[digest(token)])).rows[0];
   if(!t)throw new HttpError(400,'This reset link has expired or already been used.');
   await tx.query('UPDATE users SET password_hash=$2 WHERE id=$1',[t.user_id,hash]);
   await tx.query('DELETE FROM sessions WHERE user_id=$1',[t.user_id]);
   await tx.query('DELETE FROM account_tokens WHERE user_id=$1 AND purpose=$2',[t.user_id,'reset']);
  });
  res.clearCookie(cookieName,cookieOptions);res.json({message:'Password updated. Sign in again on each device.'});
 });
 router.get('/export',requireUser,requireVerified,async(req,res)=>{
  const notes=(await db.query('SELECT title,subject,content,status,visual,created_at,updated_at FROM notes WHERE user_id=$1 ORDER BY created_at',[req.user.id])).rows;
  res.attachment('liiightnotes-export.json').json({account:publicUser(req.user),notes});
 });
 router.delete('/account',requireUser,async(req,res)=>{
  const {password}=z.object({password:passwordSchema}).parse(req.body);
  await consumeLimit(db,'delete-account:'+req.user.id,5,900);
  if(!await verifyPassword(password,req.user.password_hash))throw new HttpError(401,'Password is incorrect.');
  await db.query('DELETE FROM users WHERE id=$1',[req.user.id]);
  res.clearCookie(cookieName,cookieOptions);res.status(204).end();
 });
 return {router,load,csrf,requireUser,requireVerified};
}
