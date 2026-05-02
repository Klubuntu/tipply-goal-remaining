#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseCssVariables(css) {
  const vars = {};
  if (!css) return vars;
  const re = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css))) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

function parseFontFamilies(css) {
  const set = new Set();
  if (!css) return set;
  const re = /font-family\s*:\s*['"]?([^;'"}]+)['"]?\s*;/gi;
  let m;
  while ((m = re.exec(css))) {
    set.add(m[1].trim());
  }
  return set;
}

async function migrate(opts = {}) {
  const root = opts.dataDir || path.join(__dirname, '..');
  const pkgVersion = opts.pkgVersion || (() => {
    try { return require(path.join(root, 'package.json')).version; } catch (e) { return '0.0.0'; }
  })();

  const configPath = path.join(root, 'config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) { config = {}; }
  }

  const cssDir = path.join(root, 'public', 'css');
  const fontsDir = path.join(root, 'public', 'fonts');

  // Ensure shapes
  config.colors = config.colors || {};
  config.fontFamilies = config.fontFamilies || [];
  config.fontFiles = config.fontFiles || [];
  if (config.clean === undefined) config.clean = false;

  // Parse colors.css
  const colorsPath = path.join(cssDir, 'colors.css');
  if (fs.existsSync(colorsPath)) {
    const css = fs.readFileSync(colorsPath, 'utf8');
    const vars = parseCssVariables(css);
    for (const [k, v] of Object.entries(vars)) {
      if (config.colors[k] === undefined) {
        config.colors[k] = v;
      }
    }
  }

  // Parse fonts.css
  const fontsCssPath = path.join(cssDir, 'fonts.css');
  if (fs.existsSync(fontsCssPath)) {
    const css = fs.readFileSync(fontsCssPath, 'utf8');
    const families = parseFontFamilies(css);
    for (const f of families) {
      if (!config.fontFamilies.includes(f)) config.fontFamilies.push(f);
    }
  }

  // Scan public/fonts
  if (fs.existsSync(fontsDir) && fs.statSync(fontsDir).isDirectory()) {
    const files = fs.readdirSync(fontsDir).filter(Boolean);
    for (const f of files) {
      if (!config.fontFiles.includes(f)) config.fontFiles.push(f);
    }
  }

  // Mark migration version
  config.migratedVersion = pkgVersion;

  // Write back config only if changed (naive write)
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    return { ok: true, message: 'Config merged/updated', config };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const opts = {};
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--dataDir' && argv[i+1]) { opts.dataDir = argv[i+1]; i++; }
      if (argv[i] === '--pkgVersion' && argv[i+1]) { opts.pkgVersion = argv[i+1]; i++; }
    }
    const res = await migrate(opts);
    if (res.ok) {
      console.log(res.message);
    } else {
      console.error('Migration failed:', res.error);
      process.exit(1);
    }
  })();
}

module.exports = migrate;
