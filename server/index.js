import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const dataFile = path.join(dataDir, 'activities.json');
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '250mb' }));

async function readActivities() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeActivities(activities) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(activities, null, 2));
}

app.get('/api/activities', async (_req, res, next) => {
  try {
    res.json(await readActivities());
  } catch (error) {
    next(error);
  }
});

app.put('/api/activities', async (req, res, next) => {
  try {
    const activities = Array.isArray(req.body?.activities) ? req.body.activities : [];
    await writeActivities(activities);
    res.json({ ok: true, count: activities.length });
  } catch (error) {
    next(error);
  }
});

app.post('/api/activities/batch', async (req, res, next) => {
  try {
    const incoming = Array.isArray(req.body?.activities) ? req.body.activities : [];
    const activities = await readActivities();
    const byId = new Map(activities.map(activity => [activity.id, activity]));

    incoming.forEach(activity => {
      if (activity?.id) byId.set(activity.id, activity);
    });

    const nextActivities = Array.from(byId.values()).sort((a, b) => {
      const aTime = new Date(a.startTime || 0).getTime();
      const bTime = new Date(b.startTime || 0).getTime();
      return bTime - aTime;
    });

    await writeActivities(nextActivities);
    res.json({ ok: true, count: nextActivities.length });
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

    const activities = await readActivities();
    const index = activities.findIndex(activity => activity.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    activities[index] = { ...activities[index], name };
    await writeActivities(activities);
    res.json(activities[index]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/activities/:id', async (req, res, next) => {
  try {
    const activities = await readActivities();
    const nextActivities = activities.filter(activity => activity.id !== req.params.id);
    await writeActivities(nextActivities);
    res.json({ ok: true, count: nextActivities.length });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/activities', async (_req, res, next) => {
  try {
    await writeActivities([]);
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
