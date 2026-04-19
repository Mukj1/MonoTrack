import { Activity } from '../types';

const MAX_BATCH_BYTES = 20 * 1024 * 1024;

const reviveActivity = (activity: Activity): Activity => ({
  ...activity,
  startTime: new Date(activity.startTime),
  path: activity.path.map(point => ({
    ...point,
    time: point.time ? new Date(point.time) : undefined,
  })),
});

export const loadStoredActivities = async (): Promise<Activity[]> => {
  const response = await fetch('/api/activities');
  if (!response.ok) throw new Error('Failed to load stored activities');
  const activities = await response.json();
  return Array.isArray(activities) ? activities.map(reviveActivity) : [];
};

export const saveStoredActivities = async (activities: Activity[]) => {
  const response = await fetch('/api/activities', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activities }),
  });
  if (!response.ok) throw new Error('Failed to save activities');
};

const postActivityBatch = async (activities: Activity[]) => {
  const response = await fetch('/api/activities/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activities }),
  });
  if (!response.ok) throw new Error('Failed to add activities');
};

export const addStoredActivities = async (activities: Activity[]) => {
  let batch: Activity[] = [];
  let batchBytes = 0;

  for (const activity of activities) {
    const activityBytes = JSON.stringify(activity).length;
    if (batch.length > 0 && batchBytes + activityBytes > MAX_BATCH_BYTES) {
      await postActivityBatch(batch);
      batch = [];
      batchBytes = 0;
    }

    batch.push(activity);
    batchBytes += activityBytes;
  }

  if (batch.length > 0) await postActivityBatch(batch);
};

export const renameStoredActivity = async (id: string, name: string) => {
  const response = await fetch(`/api/activities/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to rename activity');
};

export const deleteStoredActivity = async (id: string) => {
  const response = await fetch(`/api/activities/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete activity');
};

export const clearStoredActivities = async () => {
  const response = await fetch('/api/activities', { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to clear activities');
};
