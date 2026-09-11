import { createHash } from 'node:crypto';
import { HttpError } from '../repositories/notes.repository.js';
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function consumeLimit(db, key, maximum, seconds) {
 const { rows } = await db.query(`INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,NOW()+$2*INTERVAL '1 second')
 ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<=NOW() THEN 1 ELSE rate_limits.count+1 END,
 expires_at=CASE WHEN rate_limits.expires_at<=NOW() THEN NOW()+$2*INTERVAL '1 second' ELSE rate_limits.expires_at END RETURNING count`,[digest(key),seconds]);
 if(rows[0].count>maximum) throw new HttpError(429,'Too many requests. Please wait before trying again.');
}
export function rateLimit(db,scope,maximum,seconds) {
 return async(req,_res,next)=>{ await consumeLimit(db,`${scope}:${req.ip}`,maximum,seconds);next(); };
}
