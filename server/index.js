import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createActivityDb } from './activityDb.js';
import { enhanceActivitiesWithPython } from './activityEnhancer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const dbFile = path.join(dataDir, 'monotrack.sqlite');
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const activityDb = createActivityDb({ dataDir, dbFile });
const storedActivities = activityDb.list();

if (storedActivities.length > 0) {
  const enhancedActivities = await enhanceActivitiesWithPython(storedActivities, { root });
  activityDb.replaceAll(enhancedActivities);
}

const app = express();
app.use(express.json({ limit: '250mb' }));

app.get('/api/activities', async (_req, res, next) => {
  try {
    res.json(activityDb.list());
  } catch (error) {
    next(error);
  }
});

app.put('/api/activities', async (req, res, next) => {
  try {
    const activities = Array.isArray(req.body?.activities) ? req.body.activities : [];
    const enhancedActivities = await enhanceActivitiesWithPython(activities, { root });
    const count = activityDb.replaceAll(enhancedActivities);
    res.json({ ok: true, count });
  } catch (error) {
    next(error);
  }
});

app.post('/api/activities/batch', async (req, res, next) => {
  try {
    const incoming = Array.isArray(req.body?.activities) ? req.body.activities : [];
    const enhancedActivities = await enhanceActivitiesWithPython(incoming, { root });
    const count = activityDb.upsertMany(enhancedActivities);
    res.json({ ok: true, count });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/activities/:id', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const didRename = activityDb.rename(req.params.id, name);
    if (!didRename) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/activities/:id', async (req, res, next) => {
  try {
    const count = activityDb.delete(req.params.id);
    res.json({ ok: true, count });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/activities', async (_req, res, next) => {
  try {
    activityDb.clear();
    res.json({ ok: true, count: 0 });
  } catch (error) {
    next(error);
  }
});

if (isProduction) {
  app.use(express.static(path.join(root, 'dist')));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(root, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    root,
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Uploaded activity data is too large for one request' });
    return;
  }
  res.status(500).json({ error: 'Local store error' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`MonoTrack local server: http://127.0.0.1:${port}/`);
});

process.on('SIGINT', () => {
  activityDb.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  activityDb.close();
  process.exit(0);
});
