import { randomUUID } from 'node:crypto';
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const required = row => { if (!row) throw new HttpError(404, 'Note not found.'); return row; };
export class NotesRepository {
  constructor(db, userId = null) { this.db = db; this.userId = userId; }
  forUser(userId) { if(!userId)throw new HttpError(401,'Please sign in.');return new NotesRepository(this.db,userId); }
  async list() { return (await this.db.query('SELECT * FROM notes WHERE user_id IS NOT DISTINCT FROM $1::uuid ORDER BY created_at DESC, id', [this.userId])).rows; }
  async get(id) { return required((await this.db.query('SELECT * FROM notes WHERE id=$1 AND user_id IS NOT DISTINCT FROM $2::uuid', [id,this.userId])).rows[0]); }
  async create(input) {
    return this.db.transaction(async tx=>{
      if(this.userId){await tx.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[this.userId]);const total=(await tx.query('SELECT COUNT(*) AS count FROM notes WHERE user_id=$1',[this.userId])).rows[0];if(Number(total.count)>=200)throw new HttpError(409,'Your notebook holds up to 200 notes. Export or remove older notes to make room.');}
      return (await tx.query('INSERT INTO notes(id,title,content,subject,user_id) VALUES($1,$2,$3,$4,$5) RETURNING *',[randomUUID(),input.title,input.content,input.subject,this.userId])).rows[0];
    });
  }
  async edit(id, input) {
    return this.db.transaction(async tx => {
      const note = required((await tx.query('SELECT * FROM notes WHERE id=$1 AND user_id IS NOT DISTINCT FROM $2::uuid FOR UPDATE', [id,this.userId])).rows[0]);
      if (['queued','processing'].includes(note.status)) throw new HttpError(409, 'Wait for generation to finish before editing.');
      return (await tx.query("UPDATE notes SET title=$2,content=$3,subject=$4,status='draft',visual=NULL,error=NULL,updated_at=NOW() WHERE id=$1 RETURNING *", [id,input.title,input.content,input.subject])).rows[0];
    });
  }
  async remove(id) {
    return this.db.transaction(async tx => {
      const note = required((await tx.query('SELECT * FROM notes WHERE id=$1 AND user_id IS NOT DISTINCT FROM $2::uuid FOR UPDATE', [id,this.userId])).rows[0]);
      if (['queued','processing'].includes(note.status)) throw new HttpError(409, 'Wait for generation to finish before deleting.');
      await tx.query('DELETE FROM notes WHERE id=$1', [id]);
    });
  }
  async complete(id) {
    return this.db.transaction(async tx => {
      const note = required((await tx.query('SELECT * FROM notes WHERE id=$1 AND user_id IS NOT DISTINCT FROM $2::uuid FOR UPDATE', [id,this.userId])).rows[0]);
      if (['queued','processing','ready'].includes(note.status)) return note;
      await tx.query('INSERT INTO generation_jobs(id,note_id) VALUES($1,$2)', [randomUUID(),id]);
      return (await tx.query("UPDATE notes SET status='queued',error=NULL,updated_at=NOW() WHERE id=$1 RETURNING *", [id])).rows[0];
    });
  }
  async jobs(id) { await this.get(id); return (await this.db.query('SELECT id,status,created_at,started_at,finished_at,error FROM generation_jobs WHERE note_id=$1 ORDER BY created_at DESC', [id])).rows; }
  async claim() {
    return this.db.transaction(async tx => {
      const job = (await tx.query("SELECT * FROM generation_jobs WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1")).rows[0];
      if (!job) return null;
      const token = randomUUID();
      await tx.query("UPDATE generation_jobs SET status='processing',started_at=NOW(),claim_token=$2 WHERE id=$1", [job.id,token]);
      const note = (await tx.query("UPDATE notes SET status='processing',updated_at=NOW() WHERE id=$1 RETURNING *", [job.note_id])).rows[0];
      return { ...job, claim_token: token, note };
    });
  }
  async finish(job, visual, error = null) {
    await this.db.transaction(async tx => {
      const status = error ? 'failed' : 'ready';
      const result = await tx.query("UPDATE generation_jobs SET status=$3,error=$4,finished_at=NOW() WHERE id=$1 AND claim_token=$2 AND status='processing' RETURNING note_id", [job.id,job.claim_token,status,error]);
      if (!result.rows.length) return;
      await tx.query('UPDATE notes SET status=$2,visual=$3::jsonb,error=$4,updated_at=NOW() WHERE id=$1', [job.note_id,status,visual ? JSON.stringify(visual) : null,error]);
    });
  }
  async recover() {
    await this.db.transaction(async tx => {
      const rows = (await tx.query("UPDATE generation_jobs SET status='failed',error='Generation was interrupted. Please retry.',finished_at=NOW() WHERE status='processing' AND started_at < NOW() - INTERVAL '5 minutes' RETURNING note_id")).rows;
      for (const row of rows) await tx.query("UPDATE notes SET status='failed',error='Generation was interrupted. Please retry.',updated_at=NOW() WHERE id=$1 AND status='processing'", [row.note_id]);
    });
  }
}
