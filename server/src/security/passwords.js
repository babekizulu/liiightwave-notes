import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from '../repositories/notes.repository.js';
const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
let hashing = 0;
async function key(password, salt) {
  // Bound memory even when multiple unauthenticated clients request password work.
  if (hashing >= 2) throw new HttpError(503, 'Sign-in is busy. Please try again shortly.');
  hashing++;
  try { return await derive(password, salt, 64, options); }
  finally { hashing--; }
}
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${(await key(password,salt)).toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [,salt,hash] = (stored || `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`).split('$');
  const candidate = await key(password,salt);
  const expected = Buffer.from(hash,'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate,expected);
}
export async function checkPassword(password, checkBreaches = true) {
  if (typeof password !== 'string' || [...password].length < 15 || [...password].length > 128 || Buffer.byteLength(password) > 512) throw new HttpError(400, 'Use a password or passphrase of 15–128 characters.');
  if (/^(.)\1+$/u.test(password) || /^(password|123456789|qwerty|letmein|iloveyou)[\d!@#$]*$/i.test(password)) throw new HttpError(400, 'Choose a less common password or passphrase.');
  if (!checkBreaches) return;
  // Only the first five SHA-1 characters leave the server, never the password or full hash.
  const digest = createHash('sha1').update(password).digest('hex').toUpperCase();
  let response;
  try { response = await fetch(`https://api.pwnedpasswords.com/range/${digest.slice(0,5)}`, { headers:{'Add-Padding':'true'}, signal:AbortSignal.timeout(7000) }); }
  catch { throw new HttpError(503, 'The password safety check is unavailable. Please try again shortly.'); }
  if(!response.ok) throw new HttpError(503, 'The password safety check is unavailable. Please try again shortly.');
  if((await response.text()).split('\n').some(line=>line.trim().split(':')[0]===digest.slice(5)&&Number(line.split(':')[1])>0)) throw new HttpError(400, 'This password has appeared in a data breach. Choose a different passphrase.');
}
