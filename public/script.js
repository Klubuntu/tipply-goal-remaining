// Fetch and display goal data

let userId, goalId, apiUrl, refreshIntervalSeconds, theme;
let intervalId;

async function loadConfig() {
  try {
    const response = await fetch('/config');
    const config = await response.json();
    userId = config.userId;
    goalId = config.goalId;
    apiUrl = config.apiUrl;
    refreshIntervalSeconds = config.refreshIntervalSeconds;
    theme = config.theme;
    document.body.className = theme;
  } catch (error) {
    console.error('Error loading config:', error);
    document.getElementById('goal-title').textContent = 'Błąd ładowania konfiguracji';
  }
}

async function fetchGoalData() {
  if (!apiUrl) return;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const config = data.config;
    const stats = data.stats;

    if (!config || !stats || !config.title || config.target == null || config.initial_value == null || stats.amount == null) {
      throw new Error('Missing required data in API response');
    }

    const title = config.title;
    const target = config.target / 100;
    const initialValue = config.initial_value / 100;
    const amount = stats.amount / 100;

    const collected = initialValue + amount;
    const remaining = target - collected;
    const percentage = (collected / target) * 100;

    document.getElementById('goal-title').textContent = title;
    document.getElementById('progress-fill').style.width = `${Math.min(percentage, 100)}%`;
    document.getElementById('progress-text').textContent = `${percentage.toFixed(1)}%`;
    document.getElementById('remaining').textContent = `Brakuje: ${remaining.toFixed(2)} zł`;
  } catch (error) {
    console.error('Error fetching goal data:', error);
    document.getElementById('goal-title').textContent = 'Błąd ładowania danych';
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
}

// Initial load
(async () => {
  await loadConfig();
  fetchGoalData();
  intervalId = setInterval(fetchGoalData, refreshIntervalSeconds * 1000);
})();