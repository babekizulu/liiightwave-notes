import { Router } from 'express';
import { consumeLimit } from '../security/limits.js';
import { z } from 'zod';
import { notesController } from '../controllers/notes.controller.js';
export function notesRoutes(repo, config) {
  const router = Router(), c = notesController(repo);
  router.get('/',c.list); router.post('/',c.create);
  router.get('/:id',c.get); router.patch('/:id',c.edit); router.delete('/:id',c.remove);
  router.patch('/:id/complete',async(req,_res,next)=>{
    const note=await repo.forUser(req.user.id).get(z.string().uuid().parse(req.params.id));
    if(!['ready','queued','processing'].includes(note.status)){
      await consumeLimit(repo.db,'generation-user:'+req.user.id,config.dailyGenerations||20,86400);
      await consumeLimit(repo.db,'generation-global',config.globalDailyGenerations||200,86400);
    }
    next();
  },c.complete); router.get('/:id/jobs',c.jobs);
  return router;
}
