import { z } from 'zod';
import { NoteInput } from '../types/visual-note.js';
const id = value => z.string().uuid().parse(value);
export function notesController(repo) {
  return {
    list: async (req,res) => res.json(await repo.forUser(req.user.id).list()),
    get: async (req,res) => res.json(await repo.forUser(req.user.id).get(id(req.params.id))),
    create: async (req,res) => res.status(201).json(await repo.forUser(req.user.id).create(NoteInput.parse(req.body))),
    edit: async (req,res) => res.json(await repo.forUser(req.user.id).edit(id(req.params.id), NoteInput.parse(req.body))),
    remove: async (req,res) => { await repo.forUser(req.user.id).remove(id(req.params.id)); res.status(204).end(); },
    complete: async (req,res) => res.status(202).json(await repo.forUser(req.user.id).complete(id(req.params.id))),
    jobs: async (req,res) => res.json(await repo.forUser(req.user.id).jobs(id(req.params.id))),
  };
}
