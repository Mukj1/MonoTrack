import fsSync from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const serializeActivity = (activity) => ({
  id: String(activity.id),
  name: String(activity.name || 'Untitled activity'),
  type: String(activity.type || 'Other'),
  start_time: new Date(activity.startTime || Date.now()).toISOString(),
  color: String(activity.color || '#8A8178'),
  distance: toNumber(activity.stats?.distance),
  duration: toNumber(activity.stats?.duration),
  moving_duration: toNumber(activity.stats?.movingDuration, toNumber(activity.stats?.duration)),
  avg_speed: toNumber(activity.stats?.avgSpeed),
  max_ele: toNumber(activity.stats?.maxEle),
  min_ele: toNumber(activity.stats?.minEle),
  elevation_gain: toNumber(activity.stats?.elevationGain),
  path_json: JSON.stringify(Array.isArray(activity.path) ? activity.path : []),
});

const deserializeActivity = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  startTime: row.start_time,
  color: row.color,
  stats: {
    distance: row.distance,
    duration: row.duration,
    movingDuration: row.moving_duration,
    avgSpeed: row.avg_speed,
    maxEle: row.max_ele,
    minEle: row.min_ele,
    elevationGain: row.elevation_gain,
  },
  path: JSON.parse(row.path_json || '[]'),
});

export function createActivityDb({ dataDir, dbFile }) {
  fsSync.mkdirSync(dataDir, { recursive: true });

  const db = new DatabaseSync(dbFile);
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      start_time TEXT NOT NULL,
      color TEXT NOT NULL,
      distance REAL NOT NULL DEFAULT 0,
      duration REAL NOT NULL DEFAULT 0,
      moving_duration REAL NOT NULL DEFAULT 0,
      avg_speed REAL NOT NULL DEFAULT 0,
      max_ele REAL NOT NULL DEFAULT 0,
      min_ele REAL NOT NULL DEFAULT 0,
      elevation_gain REAL NOT NULL DEFAULT 0,
      path_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time DESC);
    CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
  `);
  const columns = db.prepare("PRAGMA table_info(activities)").all().map(column => column.name);
  if (!columns.includes('moving_duration')) {
    db.exec('ALTER TABLE activities ADD COLUMN moving_duration REAL NOT NULL DEFAULT 0');
    db.exec('UPDATE activities SET moving_duration = duration WHERE moving_duration = 0');
  }

  const listStatement = db.prepare(`
    SELECT * FROM activities
    ORDER BY datetime(start_time) DESC
  `);

  const replaceStatement = db.prepare(`
    INSERT INTO activities (
      id, name, type, start_time, color, distance, duration, avg_speed,
      moving_duration, max_ele, min_ele, elevation_gain, path_json, updated_at
    ) VALUES (
      :id, :name, :type, :start_time, :color, :distance, :duration, :avg_speed,
      :moving_duration, :max_ele, :min_ele, :elevation_gain, :path_json, CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      type = excluded.type,
      start_time = excluded.start_time,
      color = excluded.color,
      distance = excluded.distance,
      duration = excluded.duration,
      moving_duration = excluded.moving_duration,
      avg_speed = excluded.avg_speed,
      max_ele = excluded.max_ele,
      min_ele = excluded.min_ele,
      elevation_gain = excluded.elevation_gain,
      path_json = excluded.path_json,
      updated_at = CURRENT_TIMESTAMP
  `);

  const renameStatement = db.prepare(`
    UPDATE activities
    SET name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const deleteStatement = db.prepare('DELETE FROM activities WHERE id = ?');
  const clearStatement = db.prepare('DELETE FROM activities');
  const countStatement = db.prepare('SELECT COUNT(*) AS count FROM activities');

  const runTransaction = (callback) => {
    db.exec('BEGIN');
    try {
      callback();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const replaceMany = (activities) => {
    runTransaction(() => {
      activities.forEach(activity => replaceStatement.run(serializeActivity(activity)));
    });
  };

  const clearAndReplace = (activities) => {
    runTransaction(() => {
      clearStatement.run();
      activities.forEach(activity => replaceStatement.run(serializeActivity(activity)));
    });
  };

  return {
    list() {
      return listStatement.all().map(deserializeActivity);
    },
    replaceAll(activities) {
      clearAndReplace(activities);
      return countStatement.get().count;
    },
    upsertMany(activities) {
      replaceMany(activities);
      return countStatement.get().count;
    },
    rename(id, name) {
      const result = renameStatement.run(name, id);
      return result.changes > 0;
    },
    delete(id) {
      deleteStatement.run(id);
      return countStatement.get().count;
    },
    clear() {
      clearStatement.run();
      return 0;
    },
    close() {
      db.close();
    },
  };
}
