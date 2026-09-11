import 'dotenv/config';
import { resolve } from 'node:path';
const production=process.env.NODE_ENV==='production';
const origin=process.env.CLIENT_ORIGIN||'http://localhost:5173';
export const config={
 production,origin,origins:[origin,...(process.env.ADDITIONAL_ORIGINS||'').split(',').filter(Boolean)],
 port:Number(process.env.PORT||3001),host:process.env.HOST||(production?'0.0.0.0':'127.0.0.1'),
 trustProxy:production?1:false,
 mode:process.env.GENERATION_MODE||'demo',model:process.env.OPENAI_MODEL||'gpt-4.1-mini',
 databaseUrl:process.env.DATABASE_URL,dataDir:resolve(process.env.DATA_DIR||'.data'),
 resendKey:process.env.RESEND_API_KEY,mailFrom:process.env.MAIL_FROM,
 checkBreaches:true,seedDemo:process.env.SEED_DEMO==='true',
 dailyGenerations:Number(process.env.DAILY_GENERATIONS||20),globalDailyGenerations:Number(process.env.GLOBAL_DAILY_GENERATIONS||200),
};
if(!['demo','openai'].includes(config.mode))throw new Error('Invalid GENERATION_MODE');
if(config.mode==='openai'&&!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required for AI generation');
if(production){
 if(!config.databaseUrl)throw new Error('Production requires DATABASE_URL; embedded storage is development-only.');
 if(!config.origins.every(url=>{try{return new URL(url).origin===url&&url.startsWith('https://')}catch{return false}}))throw new Error('Production origins must be exact HTTPS origins.');
 if(!config.resendKey||!config.mailFrom)throw new Error('Configure verified email delivery before enabling production registration.');
}
for(const limit of [config.dailyGenerations,config.globalDailyGenerations])if(!Number.isInteger(limit)||limit<1||limit>10000)throw new Error('Invalid generation quota');
