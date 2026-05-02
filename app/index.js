// app/index.js - Fastify server for Tipply Goal Widget

const debug = process.argv.includes('--debug');
const fastify = require('fastify')({ logger: debug });
const path = require('path');
const fs = require('fs');

const dataDir = process.pkg
  ? path.join(path.dirname(process.execPath), 'tipply-gr')
  : path.join(__dirname, '..');

// Read config
const configPath = path.join(dataDir, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Parse goalUrl to extract userId and goalId
const goalUrl = (config.goalUrl || '').trim();
let userId = null;
let goalId = null;
let apiUrl = null;
let configWarning = 'Uzupełnij config.json i ustaw goalUrl.';

if (goalUrl) {
  try {
    const url = new URL(goalUrl);
    const pathParts = url.pathname.split('/');
    userId = pathParts[2]; // TIPS_GOAL/{user_id}
    goalId = pathParts[4]; // GOAL/{goal_id}
    apiUrl = `https://tipply.pl/api/widget/goal/${goalId}/${userId}`;
    configWarning = '';
  } catch (error) {
    configWarning = 'Nieprawidłowy goalUrl w config.json.';
  }
}

const refreshIntervalSeconds = config.refreshIntervalSeconds || 3;
const theme = config.theme || 'dark';

const indexHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tipply Goal Remaining</title>
  <link rel="stylesheet" href="/css/colors.css">
  <link rel="stylesheet" href="/css/goal.css">
</head>
<body>
  <div class="container">
    <div class="title" id="goal-title">Ładowanie...</div>
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill" style="width: 0%;"></div>
      </div>
      <div class="progress-text" id="progress-text">0%</div>
    </div>
    <div class="remaining" id="remaining">Brakuje: 0.00 zł</div>
  </div>
  <script src="/script.js"></script>
</body>
</html>`;

const scriptJs = [
  '// Fetch and display goal data',
  '',
  'let userId, goalId, apiUrl, refreshIntervalSeconds, theme;',
  'let intervalId;',
  '',
  'async function loadConfig() {',
  '  try {',
  "    const response = await fetch('/config');",
  '    const config = await response.json();',
  '    userId = config.userId;',
  '    goalId = config.goalId;',
  '    apiUrl = config.apiUrl;',
  '    refreshIntervalSeconds = config.refreshIntervalSeconds;',
  '    theme = config.theme;',
  '    document.body.className = theme;',
  '    if (!apiUrl) {',
  "      document.getElementById('goal-title').textContent = config.configWarning || 'Uzupełnij config.json i ustaw goalUrl.';",
  '      return false;',
  '    }',
  '    return true;',
  '  } catch (error) {',
  "    console.error('Error loading config:', error);",
  "    document.getElementById('goal-title').textContent = 'Błąd ładowania konfiguracji';",
  '    return false;',
  '  }',
  '}',
  '',
  'async function fetchGoalData() {',
  '  if (!apiUrl) return;',
  '  try {',
  '    const response = await fetch(apiUrl);',
  '    const data = await response.json();',
  '',
  '    const config = data.config;',
  '    const stats = data.stats;',
  '',
  '    if (!config || !stats || !config.title || config.target == null || config.initial_value == null || stats.amount == null) {',
  "      throw new Error('Missing required data in API response');",
  '    }',
  '',
  '    const title = config.title;',
  '    const target = config.target / 100;',
  '    const initialValue = config.initial_value / 100;',
  '    const amount = stats.amount / 100;',
  '',
  '    const collected = initialValue + amount;',
  '    const remaining = target - collected;',
  '    const percentage = (collected / target) * 100;',
  '',
  "    document.getElementById('goal-title').textContent = title;",
  "    document.getElementById('progress-fill').style.width = `" + '${Math.min(percentage, 100)}' + "%`;",
  "    document.getElementById('progress-text').textContent = `" + '${percentage.toFixed(1)}' + "%`;",
  "    document.getElementById('remaining').textContent = `Brakuje: " + '${remaining.toFixed(2)}' + " zł`;",
  '  } catch (error) {',
  "    console.error('Error fetching goal data:', error);",
  "    document.getElementById('goal-title').textContent = 'Błąd ładowania danych';",
  '    if (intervalId) {',
  '      clearInterval(intervalId);',
  '      intervalId = null;',
  '    }',
  '  }',
  '}',
  '',
  '// Initial load',
  '(async () => {',
  '  const configured = await loadConfig();',
  '  if (!configured) return;',
  '  fetchGoalData();',
  '  intervalId = setInterval(fetchGoalData, refreshIntervalSeconds * 1000);',
  '})();',
].join('\n');

// Register static file serving
fastify.register(require('@fastify/static'), {
  root: path.join(dataDir, 'public'),
  prefix: '/', // optional: default '/'
});

// Route for root
fastify.get('/', async (request, reply) => {
  return reply.type('text/html; charset=utf-8').send(indexHtml);
});

fastify.get('/script.js', async (request, reply) => {
  return reply.type('application/javascript; charset=utf-8').send(scriptJs);
});

// Route for config
fastify.get('/config', async (request, reply) => {
  return { userId, goalId, apiUrl, refreshIntervalSeconds, theme, configWarning };
});

// Redirect not found to root
fastify.setNotFoundHandler((request, reply) => {
  reply.redirect('/');
});

// Start server
const start = async () => {
  const host = '0.0.0.0';
  const preferredPorts = [3785, 3000];

  for (const port of preferredPorts) {
    try {
      await fastify.listen({ port, host });
      console.log(`Server running on http://localhost:${port}`);
      return;
    } catch (err) {
      if (err.code !== 'EADDRINUSE') {
        console.error(err);
        process.exit(1);
      }
    }
  }

  try {
    await fastify.listen({ port: 0, host });
    const address = fastify.server.address();
    const actualPort = typeof address === 'object' ? address.port : address;
    console.log(`Server running on http://localhost:${actualPort}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();