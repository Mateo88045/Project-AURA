import { Hono } from 'hono';
import type { ApiVariables } from '../middleware/auth.js';
import { scanAssignmentPhoto } from '../lib/geminiVision.js';
import { env } from '../env.js';

export const ocrRouter = new Hono<{ Variables: ApiVariables }>();

// POST /v1/ocr — photo → structured task (Blueprint §6.2, Pipeline B).
ocrRouter.post('/', async (c) => {
  if (!env.googleAiKey) {
    return c.json(
      { error: 'OCR is not configured (set GOOGLE_GENERATIVE_AI_API_KEY)' },
      503,
    );
  }

  const body = (await c.req.json().catch(() => null)) as {
    image?: unknown;
  } | null;

  const image = typeof body?.image === 'string' ? body.image : '';
  // Strip a data: URI prefix if the client sent one.
  const base64 = image.includes(',') ? image.slice(image.indexOf(',') + 1) : image;

  if (!base64 || base64.length < 100) {
    return c.json({ error: 'Expected { image: base64 }' }, 400);
  }

  try {
    const scanned = await scanAssignmentPhoto(base64);
    return c.json(scanned);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[ocr] vision error', e);
    return c.json(
      { error: e instanceof Error ? e.message : 'OCR failed' },
      502,
    );
  }
});
