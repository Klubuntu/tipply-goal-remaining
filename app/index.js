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
let goalUrl = (config.goalUrl || '').trim();
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

let refreshIntervalSeconds = config.refreshIntervalSeconds || 3;
let theme = config.theme || 'dark';

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
  "      window.location.href = '/config-page';",
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

// Configuration page
const configPageHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfiguracja - Tipply Goal Remaining</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body.minimal {
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .config-container {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 500px;
      backdrop-filter: blur(8px);
    }
    h1 {
      font-size: 24px;
      margin-bottom: 30px;
      text-align: center;
    }
    .form-group {
      margin-bottom: 25px;
    }
    label {
      display: block;
      font-size: 14px;
      margin-bottom: 8px;
      opacity: 0.9;
    }
    input, select {
      width: 100%;
      padding: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      transition: all 0.2s;
    }
    input:focus, select:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.12);
    }
    .button-group {
      display: flex;
      gap: 12px;
      margin-top: 30px;
    }
    button {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-save {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: #000;
    }
    .btn-save:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    }
    .btn-cancel {
      background: rgba(156, 163, 175, 0.3);
      color: #fff;
      border: 1px solid rgba(156, 163, 175, 0.5);
    }
    .btn-cancel:hover {
      background: rgba(156, 163, 175, 0.5);
    }
    .error {
      color: #ef4444;
      font-size: 12px;
      margin-top: 6px;
      display: none;
    }
    .success {
      color: #22c55e;
      font-size: 12px;
      margin-top: 6px;
      display: none;
    }
  </style>
</head>
<body class="minimal">
  <div class="config-container">
    <h1>Konfiguracja</h1>
    <form id="configForm">
      <div class="form-group">
        <label for="goalUrl">URL celu Tipply</label>
        <input type="url" id="goalUrl" name="goalUrl" placeholder="https://widgets.tipply.pl/TIPS_GOAL/..." required>
        <div class="error" id="goalUrlError"></div>
      </div>
      <div class="form-group">
        <label for="refreshIntervalSeconds">Interwał odświeżania (sekundy)</label>
        <input type="number" id="refreshIntervalSeconds" name="refreshIntervalSeconds" min="1" max="3600" value="3" required>
      </div>
      <div class="form-group">
        <label for="theme">Motyw</label>
        <select id="theme" name="theme">
          <option value="dark">dark</option>
          <option value="minimal">minimal</option>
          <option value="purple">purple</option>
          <option value="blue">blue</option>
          <option value="green">green</option>
          <option value="red">red</option>
          <option value="transparent">transparent</option>
        </select>
      </div>
      <div class="button-group">
        <button type="submit" class="btn-save">Zapisz</button>
        <button type="button" class="btn-cancel" onclick="window.location.href='/'">Anuluj</button>
      </div>
      <div class="error" id="formError"></div>
      <div class="success" id="formSuccess">Konfiguracja zapisana! Przekierowywanie...</div>
    </form>
  </div>
  <script>
    document.body.className = localStorage.getItem('theme') || 'minimal';
    
    async function loadCurrentConfig() {
      try {
        const response = await fetch('/config-data');
        const data = await response.json();
        if (data.goalUrl) {
          document.getElementById('goalUrl').value = data.goalUrl;
        }
        if (data.refreshIntervalSeconds) {
          document.getElementById('refreshIntervalSeconds').value = data.refreshIntervalSeconds;
        }
        if (data.theme) {
          document.getElementById('theme').value = data.theme;
          document.body.className = data.theme;
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formError = document.getElementById('formError');
      const formSuccess = document.getElementById('formSuccess');
      formError.style.display = 'none';
      formSuccess.style.display = 'none';
      
      try {
        const response = await fetch('/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalUrl: document.getElementById('goalUrl').value,
            refreshIntervalSeconds: parseInt(document.getElementById('refreshIntervalSeconds').value),
            theme: document.getElementById('theme').value,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          formError.textContent = error.error || 'Błąd zapisywania';
          formError.style.display = 'block';
          return;
        }
        
        formSuccess.style.display = 'block';
        setTimeout(() => window.location.href = '/', 1500);
      } catch (error) {
        formError.textContent = 'Błąd sieci: ' + error.message;
        formError.style.display = 'block';
      }
    });
    
    document.getElementById('theme').addEventListener('change', (e) => {
      document.body.className = e.target.value;
      localStorage.setItem('theme', e.target.value);
    });
    
    loadCurrentConfig();
  </script>
</body>
</html>`;

fastify.get('/config-page', async (request, reply) => {
  return reply.type('text/html; charset=utf-8').send(configPageHtml);
});

// Route for config API (GET - returns current config)
fastify.get('/config', async (request, reply) => {
  return { userId, goalId, apiUrl, refreshIntervalSeconds, theme, configWarning };
});

// Route for config data (GET - for config page to load current values)
fastify.get('/config-data', async (request, reply) => {
  return { goalUrl, refreshIntervalSeconds, theme };
});

// Route for config page (POST - saves new config)
fastify.post('/config', async (request, reply) => {
  try {
    const { goalUrl: newGoalUrl, refreshIntervalSeconds: newInterval, theme: newTheme } = request.body;
    
    if (!newGoalUrl || !newGoalUrl.trim()) {
      return reply.status(400).send({ error: 'goalUrl is required' });
    }
    
    const newConfig = {
      goalUrl: newGoalUrl.trim(),
      refreshIntervalSeconds: Math.max(1, newInterval || 3),
      theme: newTheme || 'dark',
    };
    
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2) + '\n');
    
    // Reload module-level config
    const updatedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    goalUrl = (updatedConfig.goalUrl || '').trim();
    const newGoalUrlTrimmed = goalUrl;
    if (newGoalUrlTrimmed) {
      try {
        const url = new URL(newGoalUrlTrimmed);
        const pathParts = url.pathname.split('/');
        userId = pathParts[2];
        goalId = pathParts[4];
        apiUrl = `https://tipply.pl/api/widget/goal/${goalId}/${userId}`;
        configWarning = '';
      } catch (error) {
        configWarning = 'Nieprawidłowy goalUrl w config.json.';
      }
    } else {
      userId = null;
      goalId = null;
      apiUrl = null;
      configWarning = 'Uzupełnij config.json i ustaw goalUrl.';
    }
    refreshIntervalSeconds = updatedConfig.refreshIntervalSeconds || 3;
    theme = updatedConfig.theme || 'dark';
    
    return { success: true, message: 'Config updated' };
  } catch (error) {
    console.error('Error saving config:', error);
    return reply.status(500).send({ error: 'Failed to save config' });
  }
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