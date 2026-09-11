import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { notesRoutes } from './routes/notes.routes.js';
import { createAuth } from './security/auth.js';
import { rateLimit } from './security/limits.js';
export function createApp(repo, config, dependencies={}) {
 const app=express();
 app.disable('x-powered-by');
 // Railway terminates TLS at one trusted reverse proxy. Never trust arbitrary forwarded chains.
 app.set('trust proxy',config.trustProxy||false);
 app.use(helmet());
 app.use((req,res,next)=>{req.requestId=randomUUID();res.set('X-Request-ID',req.requestId);res.set('Cache-Control','no-store');res.set('Referrer-Policy','no-referrer');next();});
 app.use(cors({origin:config.origins||[config.origin],credentials:true,allowedHeaders:['Content-Type','X-CSRF-Token','X-Requested-With']}));
 app.get('/api/health',async(_req,res)=>{await repo.db.query('SELECT 1');res.json({ok:true,generationMode:config.mode,storage:repo.db.kind});});
 app.use('/api',rateLimit(repo.db,'api',240,60));
 app.use((req,res,next)=>{
  if(!['GET','HEAD','OPTIONS'].includes(req.method)) {
   if(req.get('Origin') && !(config.origins||[config.origin]).includes(req.get('Origin')))return res.status(403).json({error:'This origin is not allowed.'});
   if(req.get('X-Requested-With')!=='LiiiGHTNOTES')return res.status(403).json({error:'This request is missing a required security header.'});
  }
  next();
 });
 app.use(express.json({limit:'64kb'}));
 const auth=createAuth(repo.db,config,dependencies);
 app.use('/api',auth.load,auth.csrf);
 app.use('/api/auth',auth.router);
 app.use('/api/notes',auth.requireUser,auth.requireVerified,notesRoutes(repo,config));
 app.use((_req,res)=>res.status(404).json({error:'Route not found.'}));
 app.use((error,req,res,_next)=>{
  if(error instanceof ZodError)return res.status(400).json({error:'Check the required fields and their allowed lengths.'});
  const status=Number.isInteger(error.status)&&error.status>=400&&error.status<=599?error.status:500;
  if(status===429)res.set('Retry-After','60');
  if(status>=500)console.error(JSON.stringify({event:'request_failed',requestId:req.requestId,status}));
  res.status(status).json({error:status<500?error.message:'This service is temporarily unavailable. Please try again shortly.',requestId:req.requestId});
 });
 return app;
}
