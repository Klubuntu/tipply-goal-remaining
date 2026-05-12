#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const configPath = path.join(repoRoot, 'config.json');

const defaultConfig = {
  goalUrl: '',
  refreshIntervalSeconds: 3,
  theme: 'dark',
  customGoalName: '',
  clean: false,
};

fs.writeFileSync(configPath, `${JSON.stringify(defaultConfig, null, 2)}\n`);
console.log('config.json reset to defaults');
