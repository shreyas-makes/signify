import { Hono } from 'hono';
import { getDatabase } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import type { SaveDraftRequest, SaveDraftResponse, Draft, ApiResponse } from '@shared/types';

const app = new Hono();

app.post('/draft', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json() as SaveDraftRequest;
    const db = getDatabase();

    if (!body.content) {
      return c.json({ success: false, error: 'Content is required' }, 400);
    }

    const wordCount = body.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const now = new Date().toISOString();

    let draftId = body.draftId;
    let draft: Draft;

    if (draftId) {
      const updateResult = await db.query(
        `UPDATE drafts 
         SET title = $1, content = $2, word_count = $3, last_saved_at = $4
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [body.title || null, body.content, wordCount, now, draftId, user.id]
      );

      if (updateResult.rows.length === 0) {
        return c.json({ success: false, error: 'Draft not found or access denied' }, 404);
      }

      draft = updateResult.rows[0];
    } else {
      const insertResult = await db.query(
        `INSERT INTO drafts (user_id, title, content, word_count, last_saved_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user.id, body.title || null, body.content, wordCount, now]
      );

      draft = insertResult.rows[0];
      draftId = draft.id;
    }

    await db.query('DELETE FROM draft_keystroke_events WHERE draft_id = $1', [draftId]);

    if (body.keystrokes && body.keystrokes.length > 0) {
      const values = body.keystrokes.map((_, index) => {
        const base = index * 4;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      }).join(', ');

      const params = body.keystrokes.flatMap(event => [
        draftId,
        event.timestamp,
        event.character,
        event.event_type
      ]);

      await db.query(
        `INSERT INTO draft_keystroke_events (draft_id, timestamp, character, event_type)
         VALUES ${values}`,
        params
      );
    }

    const response: SaveDraftResponse = {
      draftId: draft.id,
      savedAt: draft.last_saved_at,
      wordCount: draft.word_count
    };

    return c.json({ success: true, data: response });

  } catch (error) {
    console.error('Save draft error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to save draft' 
    }, 500);
  }
});

app.get('/drafts', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const db = getDatabase();

    const result = await db.query(
      `SELECT * FROM drafts 
       WHERE user_id = $1 
       ORDER BY last_saved_at DESC`,
      [user.id]
    );

    const response: ApiResponse<Draft[]> = {
      success: true,
      data: result.rows
    };

    return c.json(response);

  } catch (error) {
    console.error('Get drafts error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch drafts' 
    }, 500);
  }
});

app.get('/draft/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const draftId = c.req.param('id');
    const db = getDatabase();

    const draftResult = await db.query(
      `SELECT * FROM drafts 
       WHERE id = $1 AND user_id = $2`,
      [draftId, user.id]
    );

    if (draftResult.rows.length === 0) {
      return c.json({ success: false, error: 'Draft not found' }, 404);
    }

    const keystrokeResult = await db.query(
      `SELECT * FROM draft_keystroke_events 
       WHERE draft_id = $1 
       ORDER BY timestamp ASC`,
      [draftId]
    );

    const response: ApiResponse<Draft & { keystrokes: any[] }> = {
      success: true,
      data: {
        ...draftResult.rows[0],
        keystrokes: keystrokeResult.rows
      }
    };

    return c.json(response);

  } catch (error) {
    console.error('Get draft error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch draft' 
    }, 500);
  }
});

app.delete('/draft/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const draftId = c.req.param('id');
    const db = getDatabase();

    const result = await db.query(
      `DELETE FROM drafts 
       WHERE id = $1 AND user_id = $2 
       RETURNING id`,
      [draftId, user.id]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, error: 'Draft not found' }, 404);
    }

    return c.json({ success: true, message: 'Draft deleted successfully' });

  } catch (error) {
    console.error('Delete draft error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to delete draft' 
    }, 500);
  }
});

export default app;