import { spawn } from 'node:child_process';
import path from 'node:path';

const getPythonCommands = () => {
  if (process.env.PYTHON) return [{ command: process.env.PYTHON, args: [] }];

  const commands = process.platform === 'win32'
    ? [
        { command: 'python', args: [] },
        { command: 'py', args: ['-3'] },
        { command: 'python3', args: [] },
      ]
    : [
        { command: 'python3', args: [] },
        { command: 'python', args: [] },
      ];

  return commands;
};

const runPythonEnhancer = ({ command, args }, script, input) => new Promise((resolve, reject) => {
  const child = spawn(command, [...args, script], {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let stdout = '';
  let stderr = '';
  let settled = false;

  child.stdout.on('data', chunk => {
    stdout += chunk;
  });

  child.stderr.on('data', chunk => {
    stderr += chunk;
  });

  child.stdin.on('error', () => {
    // The child may exit before consuming stdin; close/error handlers decide the result.
  });

  child.on('error', error => {
    if (settled) return;
    settled = true;
    reject(error);
  });

  child.on('close', code => {
    if (settled) return;
    settled = true;

    if (code !== 0) {
      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
      return;
    }

    try {
      const parsed = JSON.parse(stdout);
      resolve(Array.isArray(parsed.activities) ? parsed.activities : null);
    } catch (error) {
      reject(error);
    }
  });

  child.stdin.end(input);
});

export function enhanceActivitiesWithPython(activities, { root }) {
  if (activities.length === 0) return Promise.resolve(activities);

  const script = path.join(root, 'server', 'python', 'enhance_activity.py');
  const input = JSON.stringify({ activities });

  return getPythonCommands().reduce(
    (promise, pythonCommand) => promise.catch(() => runPythonEnhancer(pythonCommand, script, input)),
    Promise.reject(new Error('No Python command attempted'))
  ).then(enhancedActivities => enhancedActivities || activities).catch(error => {
    console.warn('Python activity enhancer unavailable; using browser-computed stats:', error.message);
    return activities;
  });
}
