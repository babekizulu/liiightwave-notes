import {writeFile} from 'node:fs/promises';
const api=process.env.API_ORIGIN;
if(!api)throw new Error('Set API_ORIGIN to the verified Railway HTTPS service origin before deploying.');
const url=new URL(api);
if(url.protocol!=='https:'||url.origin!==api||url.username||url.password)throw new Error('API_ORIGIN must be a plain HTTPS origin, without credentials or a path.');
await writeFile(new URL('../dist/_redirects',import.meta.url),`/api/* ${api}/api/:splat 200!\n/* /index.html 200\n`);
console.log('Same-origin API proxy and SPA routes generated.');
