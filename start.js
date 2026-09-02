const { execSync, spawn } = require('child_process');
const path = require('path');

const port = process.argv[2] || 3000;

// Start the Next.js server
const server = spawn('node', [
  'node_modules/.bin/next',
  'start',
  '-p', String(port)
], {
  cwd: path.resolve(__dirname),
  stdio: 'ignore',
  detached: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

server.unref();

console.log(`BuildMe server started on port ${port} (PID: ${server.pid})`);
