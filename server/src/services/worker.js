import { publicGenerationError } from './generation.service.js';
export function createWorker(repo, generate, interval = 800) {
  let timer, running = false, stopping = false, active;
  async function tick() {
    if (running || stopping) return;
    running = true;
    try {
      await repo.recover();
      const job = await repo.claim();
      if (job) {
        try { await repo.finish(job, await generate(job.note)); }
        catch (error) { await repo.finish(job, null, publicGenerationError(error)); }
      }
    } catch { console.error('Generation worker could not reach storage; it will retry.'); }
    finally { running = false; }
  }
  return {
    start() { timer = setInterval(() => { if (!running) active = tick(); }, interval); active = tick(); },
    async stop() { stopping = true; clearInterval(timer); await active; },
    tick,
  };
}
