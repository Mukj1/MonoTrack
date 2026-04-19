import { spawn } from 'node:child_process';
import path from 'node:path';

export function enhanceActivitiesWithPython(activities, { root }) {
  if (activities.length === 0) return Promise.resolve(activities);

  const script = path.join(root, 'server', 'python', 'enhance_activity.py');
  const input = JSON.stringify({ activities });

  return new Promise(resolve => {
    const child = spawn('python3', [script], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk;
    });

    child.stderr.on('data', chunk => {
      stderr += chunk;
    });

    child.stdin.on('error', () => {
      // The child may exit before consuming stdin; fall back on close/error handlers.
    });

    child.on('error', error => {
      console.warn('Python activity enhancer unavailable:', error.message);
      resolve(activities);
    });

    child.on('close', code => {
      if (code !== 0) {
        console.warn('Python activity enhancer failed:', stderr.trim());
        resolve(activities);
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(Array.isArray(parsed.activities) ? parsed.activities : activities);
      } catch (error) {
        console.warn('Python activity enhancer returned invalid JSON:', error.message);
        resolve(activities);
      }
    });

    child.stdin.end(input);
  });
}
